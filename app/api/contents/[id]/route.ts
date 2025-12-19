import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  UpdateContentSchema,
  UpdateContentMetricsSchema,
  validateRequest,
} from '@/lib/validations'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/contents/[id] - 콘텐츠 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        collaboration: {
          include: {
            campaign: true,
            influencer: {
              include: {
                channels: true,
              },
            },
          },
        },
        channel: true,
      },
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Failed to fetch content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// PUT /api/contents/[id] - 콘텐츠 수정
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const validation = validateRequest(UpdateContentSchema, body)
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 })
    }

    const content = await prisma.content.update({
      where: { id },
      data: validation.data,
      include: {
        collaboration: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
            influencer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        channel: true,
      },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Failed to update content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

// PATCH /api/contents/[id] - 콘텐츠 성과 지표 업데이트
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const validation = validateRequest(UpdateContentMetricsSchema, body)
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 })
    }

    const content = await prisma.content.update({
      where: { id },
      data: {
        ...validation.data,
        metricsUpdatedAt: new Date(),
      },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Failed to update content metrics:', error)
    return NextResponse.json(
      { error: 'Failed to update content metrics' },
      { status: 500 }
    )
  }
}

// DELETE /api/contents/[id] - 콘텐츠 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    await prisma.content.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete content:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}
