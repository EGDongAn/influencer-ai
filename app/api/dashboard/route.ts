import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard - 대시보드 통계 조회
export async function GET() {
  try {
    // 인플루언서 통계
    const influencerStats = await prisma.influencer.groupBy({
      by: ['tier'],
      where: { isActive: true },
      _count: true,
    })

    const totalInfluencers = await prisma.influencer.count({
      where: { isActive: true },
    })

    const tierCounts = {
      VIP: 0,
      GOLD: 0,
      SILVER: 0,
      BRONZE: 0,
    }

    influencerStats.forEach((stat) => {
      tierCounts[stat.tier] = stat._count
    })

    // 캠페인 통계
    const activeCampaigns = await prisma.campaign.count({
      where: { status: 'IN_PROGRESS' },
    })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const completedThisMonth = await prisma.campaign.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    // 이번 주 일정 (새로운 Schedule 모델 사용)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const weeklySchedule = await prisma.schedule.findMany({
      where: {
        scheduledDate: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
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
      },
    })

    const shootingCount = weeklySchedule.filter((s) => s.type === 'SHOOTING').length
    const uploadCount = weeklySchedule.filter((s) => s.type === 'UPLOAD').length

    // 콘텐츠 성과
    const contentStats = await prisma.content.aggregate({
      _sum: {
        views: true,
        likes: true,
        comments: true,
      },
      _count: true,
    })

    // 진행 중인 협업
    const activeCollaborations = await prisma.collaboration.findMany({
      where: {
        status: {
          in: ['CONTACTED', 'NEGOTIATING', 'CONFIRMED', 'SHOOTING_DONE', 'PROGRESS_DONE'],
        },
      },
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
            tier: true,
            profileImageUrl: true,
          },
        },
        schedules: {
          where: {
            status: {
              notIn: ['COMPLETED', 'CANCELLED'],
            },
            scheduledDate: {
              gte: now,
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // 다가오는 일정 (새로운 Schedule 모델 사용)
    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        scheduledDate: { gte: now },
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
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
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
    })

    return NextResponse.json({
      influencers: {
        total: totalInfluencers,
        ...tierCounts,
      },
      campaigns: {
        active: activeCampaigns,
        completedThisMonth,
      },
      schedule: {
        total: weeklySchedule.length,
        shooting: shootingCount,
        upload: uploadCount,
      },
      content: {
        total: contentStats._count,
        views: contentStats._sum.views || 0,
        likes: contentStats._sum.likes || 0,
        comments: contentStats._sum.comments || 0,
      },
      activeCollaborations,
      upcomingSchedules,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
