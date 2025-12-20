// AI 채팅용 도구 정의
import { tool } from 'ai'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { searchInfluencersByTreatment, getDashboardContext } from './rag'

// 인플루언서 검색 도구
export const searchInfluencersTool = tool({
  description: '인플루언서를 검색합니다. 이름, 티어, 카테고리 등으로 검색할 수 있습니다.',
  inputSchema: z.object({
    query: z.string().optional().describe('검색어 (이름, 닉네임 등)'),
    tier: z.enum(['VIP', 'GOLD', 'SILVER', 'BRONZE']).optional().describe('인플루언서 티어'),
    category: z.string().optional().describe('카테고리 (뷰티, 건강 등)'),
    limit: z.number().optional().default(10).describe('검색 결과 수'),
  }),
  execute: async ({ query, tier, category, limit }) => {
    const influencers = await prisma.influencer.findMany({
      where: {
        isActive: true,
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nickname: { contains: query, mode: 'insensitive' } },
          ],
        }),
        ...(tier && { tier }),
        ...(category && { category: { has: category } }),
      },
      include: {
        channels: true,
        _count: { select: { collaborations: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return influencers.map((inf) => ({
      id: inf.id,
      name: inf.name,
      nickname: inf.nickname,
      tier: inf.tier,
      category: inf.category,
      channels: inf.channels.map((ch) => ({
        platform: ch.platform,
        handle: ch.handle,
        followerCount: ch.followerCount,
      })),
      collaborationCount: inf._count.collaborations,
    }))
  },
})

// 인플루언서 상세 조회 도구
export const getInfluencerTool = tool({
  description: '특정 인플루언서의 상세 정보를 조회합니다.',
  inputSchema: z.object({
    id: z.string().describe('인플루언서 ID'),
  }),
  execute: async ({ id }) => {
    const influencer = await prisma.influencer.findUnique({
      where: { id },
      include: {
        channels: true,
        collaborations: {
          include: {
            campaign: true,
            contents: true,
            treatments: {
              include: { treatment: true },
            },
            schedules: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!influencer) return { error: '인플루언서를 찾을 수 없습니다.' }

    return {
      ...influencer,
      collaborations: influencer.collaborations.map((collab) => ({
        id: collab.id,
        campaign: {
          id: collab.campaign.id,
          name: collab.campaign.name,
          clientName: collab.campaign.clientName,
        },
        status: collab.status,
        fee: collab.fee ? Number(collab.fee) : null,
        feeType: collab.feeType,
        treatments: collab.treatments.map((t) => t.treatment.name),
        contentCount: collab.contents.length,
        schedulesCount: collab.schedules.length,
      })),
    }
  },
})

// 인플루언서 정보 수정 도구
export const updateInfluencerTool = tool({
  description: '인플루언서 정보를 수정합니다. 반드시 사용자 확인 후 수정하세요.',
  inputSchema: z.object({
    id: z.string().describe('인플루언서 ID'),
    name: z.string().optional().describe('이름'),
    nickname: z.string().optional().describe('활동명'),
    tier: z.enum(['VIP', 'GOLD', 'SILVER', 'BRONZE']).optional().describe('티어'),
    category: z.array(z.string()).optional().describe('카테고리'),
    notes: z.string().optional().describe('메모'),
  }),
  execute: async ({ id, ...data }) => {
    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.nickname !== undefined) updateData.nickname = data.nickname
    if (data.tier) updateData.tier = data.tier
    if (data.category) updateData.category = data.category
    if (data.notes !== undefined) updateData.notes = data.notes

    const influencer = await prisma.influencer.update({
      where: { id },
      data: updateData,
    })

    return { success: true, influencer }
  },
})

// 캠페인 검색 도구
export const searchCampaignsTool = tool({
  description: '캠페인을 검색합니다.',
  inputSchema: z.object({
    query: z.string().optional().describe('검색어 (캠페인명, 병원명 등)'),
    status: z
      .enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .optional()
      .describe('캠페인 상태'),
    limit: z.number().optional().default(10).describe('검색 결과 수'),
  }),
  execute: async ({ query, status, limit }) => {
    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { clientName: { contains: query, mode: 'insensitive' } },
          ],
        }),
        ...(status && { status }),
      },
      include: {
        _count: { select: { collaborations: true } },
      },
      take: limit,
      orderBy: { startDate: 'desc' },
    })

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      clientName: c.clientName,
      status: c.status,
      type: c.type,
      startDate: c.startDate,
      endDate: c.endDate,
      budget: c.budget ? Number(c.budget) : null,
      collaborationCount: c._count.collaborations,
    }))
  },
})

// 캠페인 상세 조회 도구
export const getCampaignTool = tool({
  description: '특정 캠페인의 상세 정보를 조회합니다.',
  inputSchema: z.object({
    id: z.string().describe('캠페인 ID'),
  }),
  execute: async ({ id }) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        collaborations: {
          include: {
            influencer: {
              include: { channels: true },
            },
            contents: true,
            treatments: {
              include: { treatment: true },
            },
            schedules: true,
          },
        },
      },
    })

    if (!campaign) return { error: '캠페인을 찾을 수 없습니다.' }

    return {
      ...campaign,
      budget: campaign.budget ? Number(campaign.budget) : null,
      collaborations: campaign.collaborations.map((collab) => ({
        id: collab.id,
        influencer: {
          id: collab.influencer.id,
          name: collab.influencer.name,
          nickname: collab.influencer.nickname,
          tier: collab.influencer.tier,
        },
        status: collab.status,
        fee: collab.fee ? Number(collab.fee) : null,
        treatments: collab.treatments.map((t) => t.treatment.name),
        contents: collab.contents.map((c) => ({
          id: c.id,
          title: c.title,
          views: c.views,
          likes: c.likes,
        })),
        schedules: collab.schedules.map((s) => ({
          id: s.id,
          type: s.type,
          scheduledDate: s.scheduledDate,
          status: s.status,
        })),
      })),
    }
  },
})

// 캠페인 생성 도구
export const createCampaignTool = tool({
  description: '새 캠페인을 생성합니다.',
  inputSchema: z.object({
    name: z.string().describe('캠페인명'),
    clientName: z.string().describe('병원명'),
    clientContact: z.string().optional().describe('담당자 연락처'),
    description: z.string().optional().describe('캠페인 설명'),
    startDate: z.string().describe('시작일 (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('종료일 (YYYY-MM-DD)'),
    type: z.enum(['COLLABORATION', 'ADVERTISEMENT', 'EVENT', 'REVIEW', 'OTHER']).optional(),
    budget: z.number().optional().describe('예산'),
  }),
  execute: async ({ startDate, endDate, ...data }) => {
    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNING',
      },
    })

    return { success: true, campaign }
  },
})

// 협업 상태 변경 도구
export const updateCollaborationStatusTool = tool({
  description: '협업 상태를 변경합니다.',
  inputSchema: z.object({
    id: z.string().describe('협업 ID'),
    status: z
      .enum([
        'CONTACTED',
        'NEGOTIATING',
        'CONFIRMED',
        'SHOOTING_DONE',
        'PROGRESS_DONE',
        'UPLOADED',
        'COMPLETED',
        'CANCELLED',
      ])
      .describe('새 상태'),
  }),
  execute: async ({ id, status }) => {
    const collaboration = await prisma.collaboration.update({
      where: { id },
      data: { status },
      include: {
        influencer: true,
        campaign: true,
      },
    })

    return {
      success: true,
      message: `${collaboration.influencer.name}님의 협업 상태가 "${status}"로 변경되었습니다.`,
    }
  },
})

// 일정 추가 도구
export const addScheduleTool = tool({
  description: '협업에 새 일정을 추가합니다.',
  inputSchema: z.object({
    collaborationId: z.string().describe('협업 ID'),
    type: z.enum(['SHOOTING', 'PROGRESS', 'UPLOAD', 'MEETING', 'REVIEW', 'OTHER']).describe('일정 유형'),
    title: z.string().optional().describe('일정 제목'),
    scheduledDate: z.string().describe('예정일 (YYYY-MM-DD)'),
    scheduledTime: z.string().optional().describe('예정 시간 (HH:mm)'),
    notes: z.string().optional().describe('메모'),
  }),
  execute: async ({ collaborationId, scheduledDate, ...data }) => {
    const schedule = await prisma.schedule.create({
      data: {
        collaborationId,
        scheduledDate: new Date(scheduledDate),
        ...data,
        status: 'SCHEDULED',
      },
      include: {
        collaboration: {
          include: {
            influencer: true,
            campaign: true,
          },
        },
      },
    })

    return {
      success: true,
      message: `${schedule.collaboration.influencer.name}님의 ${data.type} 일정이 ${scheduledDate}에 추가되었습니다.`,
    }
  },
})

// 시술 검색 도구
export const searchTreatmentsTool = tool({
  description: '시술을 검색하고, 해당 시술 경험이 있는 인플루언서를 찾습니다.',
  inputSchema: z.object({
    query: z.string().describe('시술명 또는 카테고리'),
    limit: z.number().optional().default(10).describe('결과 수'),
  }),
  execute: async ({ query, limit }) => {
    const result = await searchInfluencersByTreatment(query, limit)

    if (!result.treatment) {
      // 시술 목록만 검색
      const treatments = await prisma.treatment.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { nameKo: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      })

      return {
        message: '정확히 일치하는 시술을 찾지 못했습니다. 관련 시술 목록입니다.',
        treatments: treatments.map((t) => ({
          id: t.id,
          name: t.name,
          nameKo: t.nameKo,
          category: t.category,
        })),
      }
    }

    return {
      treatment: result.treatment,
      influencers: result.influencers,
    }
  },
})

// 대시보드 통계 조회 도구
export const getDashboardStatsTool = tool({
  description: '대시보드 통계와 현황을 조회합니다.',
  inputSchema: z.object({}),
  execute: async () => {
    const context = await getDashboardContext()
    return { summary: context }
  },
})

// 모든 도구 내보내기
export const chatTools = {
  searchInfluencers: searchInfluencersTool,
  getInfluencer: getInfluencerTool,
  updateInfluencer: updateInfluencerTool,
  searchCampaigns: searchCampaignsTool,
  getCampaign: getCampaignTool,
  createCampaign: createCampaignTool,
  updateCollaborationStatus: updateCollaborationStatusTool,
  addSchedule: addScheduleTool,
  searchTreatments: searchTreatmentsTool,
  getDashboardStats: getDashboardStatsTool,
}
