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
    const {
      campaignId,
      influencerId,
      fee,
      feeType,
      status,
      notes,
      shootingRounds = 1,
      progressRounds = 2,
      treatmentIds = [],
      createSchedules = false,
    } = body

    // 트랜잭션으로 협업 + 시술 연결 + 일정 생성
    const collaboration = await prisma.$transaction(async (tx) => {
      // 1. 협업 생성
      const collab = await tx.collaboration.create({
        data: {
          campaignId,
          influencerId,
          fee,
          feeType,
          status,
          notes,
          shootingRounds,
          progressRounds,
        },
        include: {
          campaign: true,
          influencer: true,
        },
      })

      // 2. 시술 연결
      if (treatmentIds.length > 0) {
        await tx.collaborationTreatment.createMany({
          data: treatmentIds.map((treatmentId: string) => ({
            collaborationId: collab.id,
            treatmentId,
          })),
        })
      }

      // 3. 일정 템플릿 생성 (옵션)
      if (createSchedules) {
        const scheduleData = []
        const today = new Date()

        // 촬영 일정 생성
        for (let i = 1; i <= shootingRounds; i++) {
          scheduleData.push({
            collaborationId: collab.id,
            type: 'SHOOTING' as const,
            title: shootingRounds > 1 ? `촬영 ${i}회차` : '촬영',
            roundNumber: i,
            totalRounds: shootingRounds,
            scheduledDate: new Date(today.getTime() + i * 7 * 24 * 60 * 60 * 1000), // 1주 간격
            status: 'SCHEDULED' as const,
          })
        }

        // 경과 사진 일정 생성
        for (let i = 1; i <= progressRounds; i++) {
          scheduleData.push({
            collaborationId: collab.id,
            type: 'PROGRESS' as const,
            title: progressRounds > 1 ? `경과 사진 ${i}회차` : '경과 사진',
            roundNumber: i,
            totalRounds: progressRounds,
            scheduledDate: new Date(
              today.getTime() + (shootingRounds * 7 + i * 14) * 24 * 60 * 60 * 1000
            ), // 2주 간격
            status: 'SCHEDULED' as const,
          })
        }

        if (scheduleData.length > 0) {
          await tx.schedule.createMany({ data: scheduleData })
        }
      }

      return collab
    })

    // 전체 데이터 반환
    const result = await prisma.collaboration.findUnique({
      where: { id: collaboration.id },
      include: {
        campaign: true,
        influencer: true,
        treatments: {
          include: { treatment: true },
        },
        schedules: true,
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create collaboration:', error)
    return NextResponse.json(
      { error: 'Failed to create collaboration' },
      { status: 500 }
    )
  }
}
