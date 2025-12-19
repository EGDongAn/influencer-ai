import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/collaborations/[id] - 협업 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      include: {
        campaign: true,
        influencer: {
          include: {
            channels: true,
          },
        },
        contents: {
          include: {
            channel: true,
          },
        },
      },
    })

    if (!collaboration) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(collaboration)
  } catch (error) {
    console.error('Failed to fetch collaboration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaboration' },
      { status: 500 }
    )
  }
}

// PUT /api/collaborations/[id] - 협업 수정
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const collaboration = await prisma.collaboration.update({
      where: { id },
      data: body,
      include: {
        campaign: true,
        influencer: true,
        contents: true,
      },
    })

    return NextResponse.json(collaboration)
  } catch (error) {
    console.error('Failed to update collaboration:', error)
    return NextResponse.json(
      { error: 'Failed to update collaboration' },
      { status: 500 }
    )
  }
}

// PATCH /api/collaborations/[id] - 협업 상태 변경 (칸반 보드용)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const collaboration = await prisma.collaboration.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        campaign: true,
        influencer: true,
      },
    })

    return NextResponse.json(collaboration)
  } catch (error) {
    console.error('Failed to update collaboration status:', error)
    return NextResponse.json(
      { error: 'Failed to update collaboration status' },
      { status: 500 }
    )
  }
}

// DELETE /api/collaborations/[id] - 협업 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    await prisma.collaboration.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete collaboration:', error)
    return NextResponse.json(
      { error: 'Failed to delete collaboration' },
      { status: 500 }
    )
  }
}
