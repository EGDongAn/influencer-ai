import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateContentSchema, validateRequest } from '@/lib/validations'

// GET /api/contents - 콘텐츠 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collaborationId = searchParams.get('collaborationId')
    const channelId = searchParams.get('channelId')
    const contentType = searchParams.get('contentType')

    const where: Record<string, unknown> = {}

    if (collaborationId) {
      where.collaborationId = collaborationId
    }

    if (channelId) {
      where.channelId = channelId
    }

    if (contentType) {
      where.contentType = contentType
    }

    const contents = await prisma.content.findMany({
      where,
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
                nickname: true,
              },
            },
          },
        },
        channel: {
          select: {
            id: true,
            platform: true,
            handle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contents)
  } catch (error) {
    console.error('Failed to fetch contents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contents' },
      { status: 500 }
    )
  }
}

// POST /api/contents - 콘텐츠 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateRequest(CreateContentSchema, body)
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 })
    }

    const content = await prisma.content.create({
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

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Failed to create content:', error)
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    )
  }
}
