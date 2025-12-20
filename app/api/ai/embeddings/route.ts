import { NextRequest, NextResponse } from 'next/server'
import {
  embedInfluencer,
  embedTreatment,
  embedContent,
  syncAllEmbeddings,
} from '@/lib/ai/embeddings'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, type, id } = body

    // 단일 항목 임베딩
    if (action === 'embed' && type && id) {
      switch (type) {
        case 'influencer':
          await embedInfluencer(id)
          return NextResponse.json({ success: true, message: `인플루언서 ${id} 임베딩 완료` })

        case 'treatment':
          await embedTreatment(id)
          return NextResponse.json({ success: true, message: `시술 ${id} 임베딩 완료` })

        case 'content':
          await embedContent(id)
          return NextResponse.json({ success: true, message: `콘텐츠 ${id} 임베딩 완료` })

        default:
          return NextResponse.json(
            { error: 'type은 influencer, treatment, content 중 하나여야 합니다.' },
            { status: 400 }
          )
      }
    }

    // 전체 동기화
    if (action === 'sync') {
      const results = await syncAllEmbeddings()
      return NextResponse.json({
        success: true,
        message: '전체 임베딩 동기화 완료',
        results,
      })
    }

    return NextResponse.json(
      { error: 'action은 embed 또는 sync여야 합니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Embeddings API error:', error)
    return NextResponse.json(
      { error: '임베딩 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
