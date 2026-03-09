# Foundry IQ Demo Suite

Azure AI Search (Foundry IQ) Knowledge Retrieval 데모 앱.
3가지 데모를 하나의 Next.js 앱에서 제공합니다.

## Demos

| Demo | Route | Status |
|------|-------|--------|
| Foundry IQ Basic | `/test` | ✅ Active |
| SharePoint Connector | `/sharepoint` | 🔧 Coming Soon |
| Agent Connector | `/agent` | 🔧 Coming Soon |

## Quick Start

1. `.env.example` → `.env.local` 복사 후 Azure 자격 증명 입력
2. `npm install`
3. `npm run dev`
4. http://localhost:3000

## Tech Stack

- Next.js 14 + React 18 + TypeScript
- Tailwind CSS + Custom Design Tokens
- Framer Motion
- Azure AI Search + Azure OpenAI

## Reference

Based on [farzad528/foundry-iq-demo](https://github.com/farzad528/foundry-iq-demo) (MIT License).
