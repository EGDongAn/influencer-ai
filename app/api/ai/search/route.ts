import { NextRequest, NextResponse } from 'next/server'
import {
  searchInfluencersByVector,
  searchInfluencersByTreatment,
  searchTreatmentsByVector,
} from '@/lib/ai/rag'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, query, limit = 10 } = body

    if (!query) {
      return NextResponse.json({ error: 'query가 필요합니다.' }, { status: 400 })
    }

    switch (type) {
      case 'influencer': {
        // 벡터 검색 시도
        try {
          const results = await searchInfluencersByVector(query, limit)
          if (results.length > 0) {
            // 상세 정보 조회
            const influencers = await prisma.influencer.findMany({
              where: { id: { in: results.map((r) => r.id) } },
              include: {
                channels: true,
                _count: { select: { collaborations: true } },
              },
            })

            return NextResponse.json({
              results: influencers.map((inf) => ({
                ...inf,
                similarity: results.find((r) => r.id === inf.id)?.similarity,
              })),
            })
          }
        } catch {
          // 벡터 검색 실패 시 텍스트 검색 fallback
        }

        // 텍스트 검색 fallback
        const influencers = await prisma.influencer.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { nickname: { contains: query, mode: 'insensitive' } },
              { category: { hasSome: [query] } },
              { notes: { contains: query, mode: 'insensitive' } },
            ],
          },
          include: {
            channels: true,
            _count: { select: { collaborations: true } },
          },
          take: limit,
        })

        return NextResponse.json({ results: influencers })
      }

      case 'treatment': {
        const result = await searchInfluencersByTreatment(query, limit)
        return NextResponse.json(result)
      }

      case 'treatment-only': {
        try {
          const results = await searchTreatmentsByVector(query, limit)
          if (results.length > 0) {
            const treatments = await prisma.treatment.findMany({
              where: { id: { in: results.map((r) => r.id) } },
            })

            return NextResponse.json({
              results: treatments.map((t) => ({
                ...t,
                similarity: results.find((r) => r.id === t.id)?.similarity,
              })),
            })
          }
        } catch {
          // fallback
        }

        const treatments = await prisma.treatment.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { nameKo: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit,
        })

        return NextResponse.json({ results: treatments })
      }

      default:
        return NextResponse.json(
          { error: 'type은 influencer, treatment, treatment-only 중 하나여야 합니다.' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
