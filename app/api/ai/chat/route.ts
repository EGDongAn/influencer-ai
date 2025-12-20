import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { NextRequest } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import { chatTools } from '@/lib/ai/tools'
import { buildChatContext } from '@/lib/ai/rag'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 마지막 사용자 메시지로 관련 컨텍스트 검색
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop()
    let ragContext = ''

    if (lastUserMessage?.content) {
      try {
        ragContext = await buildChatContext(lastUserMessage.content)
      } catch (e) {
        console.error('RAG context build failed:', e)
      }
    }

    // 시스템 프롬프트에 RAG 컨텍스트 추가
    const systemPrompt = ragContext
      ? `${SYSTEM_PROMPTS.chat}\n\n---\n\n## 검색된 관련 정보\n${ragContext}`
      : SYSTEM_PROMPTS.chat

    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages,
      tools: chatTools,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'AI 채팅 중 오류가 발생했습니다.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
