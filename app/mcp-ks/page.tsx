import type { Metadata } from 'next'

import { McpKnowledgeSourceDemo } from '@/components/mcp-ks/mcp-knowledge-source-demo'

export const metadata: Metadata = {
  title: 'Microsoft Learn MCP KS | Foundry IQ Demo Suite',
  description: 'Live Microsoft Learn grounding through an Azure AI Search MCP Server Knowledge Source.',
}

export default function McpKnowledgeSourcePage() {
  return <McpKnowledgeSourceDemo />
}
