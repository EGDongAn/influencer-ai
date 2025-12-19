import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/collaborations - 협업 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const campaignId = searchParams.get('campaignId')
    const influencerId = searchParams.get('influencerId')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (campaignId) {
      where.campaignId = campaignId
    }

    if (influencerId) {
      where.influencerId = influencerId
    }

    const collaborations = await prisma.collaboration.findMany({
      where,
      include: {
        campaign: true,
        influencer: {
          include: {
            channels: true,
          },
        },
        contents: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(collaborations)
  } catch (error) {
    console.error('Failed to fetch collaborations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaborations' },
      { status: 500 }
    )
  }
}

// POST /api/collaborations - 협업 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const collaboration = await prisma.collaboration.create({
      data: body,
      include: {
        campaign: true,
        influencer: true,
      },
    })

    return NextResponse.json(collaboration, { status: 201 })
  } catch (error) {
    console.error('Failed to create collaboration:', error)
    return NextResponse.json(
      { error: 'Failed to create collaboration' },
      { status: 500 }
    )
  }
}
