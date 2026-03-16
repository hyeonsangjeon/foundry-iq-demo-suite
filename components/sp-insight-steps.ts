import { InsightStep } from '@/components/insight-popup'

export const SP_INSIGHT_STEPS: InsightStep[] = [
  {
    id: 1,
    title: 'Enterprise Document Search',
    description: 'SharePoint documents are automatically indexed by AI Search. Just upload your documents and search begins.',
    poweredBy: 'Azure AI Search — SharePoint Indexer',
  },
  {
    id: 2,
    title: 'Auto-Indexing Pipeline',
    description: 'PDF, DOCX, XLSX, PPTX are auto-extracted, chunked into 2000-char segments, vectorized, and indexed. Zero code required.',
    poweredBy: 'Azure AI Search — Skillset Pipeline',
  },
  {
    id: 3,
    title: 'Chunking & Embedding',
    description: 'SplitSkill divides documents into 2000-char chunks with 500-char overlap to preserve context. 1536-dim vectors are generated.',
    poweredBy: 'Azure OpenAI — text-embedding-3-large',
  },
  {
    id: 4,
    title: 'Knowledge Base Query',
    description: 'Once SharePoint documents are connected to a KB, you can search with the same Agentic Retrieval as Phase 1.',
    poweredBy: 'Foundry IQ — Agentic Retrieval',
  },
  {
    id: 5,
    title: 'Enterprise RAG Complete',
    description: 'Any enterprise can transform their SharePoint document library into AI search. Setup time: 5 minutes.',
    poweredBy: 'Foundry IQ — Production Ready',
  },
]
