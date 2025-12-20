import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

const UpdateScheduleSchema = z.object({
  type: z.enum(['SHOOTING', 'PROGRESS', 'UPLOAD', 'MEETING', 'REVIEW', 'OTHER']).optional(),
  title: z.string().optional().nullable(),
  scheduledDate: z.string().or(z.date()).optional(),
  scheduledTime: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  completedAt: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/schedules/[id] - 스케줄 상세 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const schedule = await prisma.schedule.findUnique({
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
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Failed to fetch schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/schedules/[id] - 스케줄 수정
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const result = UpdateScheduleSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { scheduledDate, completedAt, ...rest } = result.data

    const updateData: Record<string, unknown> = { ...rest }
    if (scheduledDate) {
      updateData.scheduledDate = new Date(scheduledDate)
    }
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Failed to update schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// PATCH /api/schedules/[id] - 스케줄 상태 변경
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const { status, completedAt } = body

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date()
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Failed to update schedule status:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule status' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - 스케줄 삭제
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    await prisma.schedule.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
