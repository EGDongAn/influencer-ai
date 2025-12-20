import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedInfluencer } from '@/lib/ai/embeddings'

// GET /api/influencers - 인플루언서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (tier) {
      where.tier = tier
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ]
    }

    const influencers = await prisma.influencer.findMany({
      where,
      include: {
        channels: true,
        _count: {
          select: { collaborations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(influencers)
  } catch (error) {
    console.error('Failed to fetch influencers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch influencers' },
      { status: 500 }
    )
  }
}

// POST /api/influencers - 인플루언서 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { channels, ...influencerData } = body

    const influencer = await prisma.influencer.create({
      data: {
        ...influencerData,
        channels: channels
          ? {
              create: channels,
            }
          : undefined,
      },
      include: {
        channels: true,
      },
    })

    // 비동기로 임베딩 생성 (응답 지연 방지)
    embedInfluencer(influencer.id).catch(console.error)

    return NextResponse.json(influencer, { status: 201 })
  } catch (error) {
    console.error('Failed to create influencer:', error)
    return NextResponse.json(
      { error: 'Failed to create influencer' },
      { status: 500 }
    )
  }
}
