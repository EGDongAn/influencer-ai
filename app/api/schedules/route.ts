import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateScheduleSchema = z.object({
  collaborationId: z.string(),
  type: z.enum(['SHOOTING', 'PROGRESS', 'UPLOAD', 'MEETING', 'REVIEW', 'OTHER']),
  title: z.string().optional(),
  scheduledDate: z.string().or(z.date()),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/schedules - 스케줄 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collaborationId = searchParams.get('collaborationId')
    const campaignId = searchParams.get('campaignId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (collaborationId) {
      where.collaborationId = collaborationId
    }

    if (campaignId) {
      where.collaboration = {
        campaignId,
      }
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    // 날짜 범위 필터
    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) {
        (where.scheduledDate as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.scheduledDate as Record<string, Date>).lte = new Date(endDate)
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        collaboration: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                clientName: true,
              },
            },
            influencer: {
              select: {
                id: true,
                name: true,
                nickname: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - 스케줄 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = CreateScheduleSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { scheduledDate, ...rest } = result.data

    const schedule = await prisma.schedule.create({
      data: {
        ...rest,
        scheduledDate: new Date(scheduledDate),
      },
      include: {
        collaboration: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                clientName: true,
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
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
