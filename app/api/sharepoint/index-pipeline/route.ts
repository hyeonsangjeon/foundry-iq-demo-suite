import { NextRequest, NextResponse } from 'next/server'
import { SP_DEMO_MODE, SP_LIVE_API_SECRET } from '@/lib/sp-config'
import { searchApiCall } from '@/lib/sp-search-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PREFIX = 'sp-airline-policies'

export async function POST(request: NextRequest) {
  const isLive = request.nextUrl.searchParams.get('mode') === 'live' && !SP_DEMO_MODE

  console.log(`[SP:index-pipeline] ${isLive ? 'LIVE' : 'MOCK'} mode — starting pipeline`)

  if (isLive) {
    const secret = request.headers.get('x-live-secret')
    if (secret !== SP_LIVE_API_SECRET) {
      console.error(`[SP:index-pipeline] ❌ 401 Unauthorized`)
      return NextResponse.json({ error: 'Unauthorized: invalid live mode secret' }, { status: 401 })
    }
  }

  if (!isLive) {
    console.log(`[SP:index-pipeline] ✅ 200 OK (mock started)`)
    return NextResponse.json({ status: 'started', startedAt: Date.now() })
  }

  // Live mode: create DataSource → Index → Skillset → Indexer → Run
  try {
    const spSiteUrl = process.env.SP_SITE_URL
    const spAppId = process.env.SP_APP_ID
    const spAppSecret = process.env.SP_APP_SECRET
    const spTenantId = process.env.SP_TENANT_ID
    const aoaiEndpoint = (process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '')

    if (!spSiteUrl || !spAppId || !spAppSecret || !spTenantId) {
      return NextResponse.json({ error: 'Missing SharePoint env vars' }, { status: 400 })
    }

    // 1. Create DataSource
    const connectionString = `SharePointOnlineEndpoint=${spSiteUrl};ApplicationId=${spAppId};ApplicationSecret=${spAppSecret};TenantId=${spTenantId}`

    await searchApiCall(`/datasources/${PREFIX}-datasource`, 'PUT', {
      name: `${PREFIX}-datasource`,
      type: 'sharepoint',
      credentials: { connectionString },
      container: {
        name: 'defaultSiteLibrary',
        query: `includeLibrariesInSite=${spSiteUrl}`,
      },
    })

    // 2. Create Index
    await searchApiCall(`/indexes/${PREFIX}-index`, 'PUT', {
      name: `${PREFIX}-index`,
      fields: [
        { name: 'chunk_id', type: 'Edm.String', key: true, analyzer: 'keyword' },
        { name: 'parent_id', type: 'Edm.String', filterable: true },
        { name: 'chunk', type: 'Edm.String', searchable: true },
        { name: 'title', type: 'Edm.String', searchable: true, filterable: true },
        {
          name: 'text_vector',
          type: 'Collection(Edm.Single)',
          dimensions: 1536,
          vectorSearchProfile: `${PREFIX}-vector-profile`,
          searchable: true,
        },
      ],
      semantic: {
        configurations: [
          {
            name: `${PREFIX}-semantic-config`,
            prioritizedFields: {
              titleField: { fieldName: 'title' },
              prioritizedContentFields: [{ fieldName: 'chunk' }],
            },
          },
        ],
      },
      vectorSearch: {
        algorithms: [
          {
            name: `${PREFIX}-hnsw-algorithm`,
            kind: 'hnsw',
            hnswParameters: { metric: 'cosine', m: 4, efConstruction: 400, efSearch: 500 },
          },
        ],
        profiles: [
          {
            name: `${PREFIX}-vector-profile`,
            algorithm: `${PREFIX}-hnsw-algorithm`,
            vectorizer: `${PREFIX}-openai-vectorizer`,
          },
        ],
        vectorizers: [
          {
            name: `${PREFIX}-openai-vectorizer`,
            kind: 'azureOpenAI',
            azureOpenAIParameters: {
              // MI 인증만 사용 (External에서 API Key 비활성)
              resourceUri: aoaiEndpoint,
              deploymentId: 'text-embedding-3-large',
              modelName: 'text-embedding-3-large',
            },
          },
        ],
      },
    })

    // 3. Create Skillset with indexProjections
    await searchApiCall(`/skillsets/${PREFIX}-skillset`, 'PUT', {
      name: `${PREFIX}-skillset`,
      skills: [
        {
          '@odata.type': '#Microsoft.Skills.Text.SplitSkill',
          textSplitMode: 'pages',
          maximumPageLength: 2000,
          pageOverlapLength: 500,
          unit: 'characters',
          inputs: [{ name: 'text', source: '/document/content' }],
          outputs: [{ name: 'textItems', targetName: 'pages' }],
        },
        {
          '@odata.type': '#Microsoft.Skills.Text.AzureOpenAIEmbeddingSkill',
          context: '/document/pages/*',
          // MI 인증만 사용 (External에서 API Key 비활성)
          resourceUri: aoaiEndpoint,
          deploymentId: 'text-embedding-3-large',
          modelName: 'text-embedding-3-large',
          dimensions: 1536,
          inputs: [{ name: 'text', source: '/document/pages/*' }],
          outputs: [{ name: 'embedding', targetName: 'text_vector' }],
        },
      ],
      indexProjections: {
        selectors: [
          {
            targetIndexName: `${PREFIX}-index`,
            parentKeyFieldName: 'parent_id',
            sourceContext: '/document/pages/*',
            mappings: [
              { name: 'text_vector', source: '/document/pages/*/text_vector' },
              { name: 'chunk', source: '/document/pages/*' },
              { name: 'title', source: '/document/metadata_spo_item_name' },
            ],
          },
        ],
        parameters: { projectionMode: 'skipIndexingParentDocuments' },
      },
    })

    // 4. Create Indexer
    await searchApiCall(`/indexers/${PREFIX}-indexer`, 'PUT', {
      name: `${PREFIX}-indexer`,
      dataSourceName: `${PREFIX}-datasource`,
      targetIndexName: `${PREFIX}-index`,
      skillsetName: `${PREFIX}-skillset`,
      parameters: {
        configuration: {
          indexedFileNameExtensions: '.pdf, .docx, .doc, .xlsx, .xls, .pptx, .ppt, .txt, .html',
          excludedFileNameExtensions: '.png, .jpg, .jpeg, .gif, .bmp',
          dataToExtract: 'contentAndMetadata',
          failOnUnsupportedContentType: false,
        },
      },
      fieldMappings: [],
      outputFieldMappings: [],
    })

    // 5. Run Indexer
    await searchApiCall(`/indexers/${PREFIX}-indexer/run`, 'POST')

    console.log(`[SP:index-pipeline] ✅ 200 OK — DataSource+Index+Skillset+Indexer created & running`)
    return NextResponse.json({ status: 'started', startedAt: Date.now() })
  } catch (error: any) {
    console.error(`[SP:index-pipeline] ❌ ${error.message}`)
    return NextResponse.json(
      { error: error.message || 'Failed to start index pipeline' },
      { status: 500 }
    )
  }
}
