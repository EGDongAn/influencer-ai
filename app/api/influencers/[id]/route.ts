import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/influencers/[id] - 인플루언서 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const influencer = await prisma.influencer.findUnique({
      where: { id },
      include: {
        channels: true,
        collaborations: {
          include: {
            campaign: true,
            contents: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(influencer)
  } catch (error) {
    console.error('Failed to fetch influencer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch influencer' },
      { status: 500 }
    )
  }
}

// PUT /api/influencers/[id] - 인플루언서 수정
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const { channels, ...influencerData } = body

    const influencer = await prisma.influencer.update({
      where: { id },
      data: {
        ...influencerData,
        channels: channels
          ? {
              deleteMany: {},
              create: channels,
            }
          : undefined,
      },
      include: {
        channels: true,
      },
    })

    return NextResponse.json(influencer)
  } catch (error) {
    console.error('Failed to update influencer:', error)
    return NextResponse.json(
      { error: 'Failed to update influencer' },
      { status: 500 }
    )
  }
}

// DELETE /api/influencers/[id] - 인플루언서 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    await prisma.influencer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete influencer:', error)
    return NextResponse.json(
      { error: 'Failed to delete influencer' },
      { status: 500 }
    )
  }
}
