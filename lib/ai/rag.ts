// RAG: 벡터 검색 및 컨텍스트 구성
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from './embeddings'

export interface SearchResult {
  id: string
  content: string
  similarity: number
}

// 인플루언서 벡터 검색
export async function searchInfluencersByVector(
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_influencers', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) throw new Error(`Search failed: ${error.message}`)

  return (data || []).map((item: { influencer_id: string; content: string; similarity: number }) => ({
    id: item.influencer_id,
    content: item.content,
    similarity: item.similarity,
  }))
}

// 시술별 인플루언서 검색
export async function searchInfluencersByTreatment(
  treatmentQuery: string,
  limit: number = 10
): Promise<{
  treatment: { id: string; name: string; category: string } | null
  influencers: Array<{
    id: string
    name: string
    nickname: string | null
    tier: string
    collaborationCount: number
    lastCollaboration: Date | null
  }>
}> {
  // 먼저 시술 검색
  const treatmentEmbedding = await generateEmbedding(treatmentQuery)

  const { data: treatmentResults } = await supabase.rpc('match_treatments', {
    query_embedding: treatmentEmbedding,
    match_threshold: 0.6,
    match_count: 1,
  })

  if (!treatmentResults || treatmentResults.length === 0) {
    // 벡터 검색 실패 시 텍스트 검색 fallback
    const treatment = await prisma.treatment.findFirst({
      where: {
        OR: [
          { name: { contains: treatmentQuery, mode: 'insensitive' } },
          { nameKo: { contains: treatmentQuery, mode: 'insensitive' } },
          { category: { contains: treatmentQuery, mode: 'insensitive' } },
        ],
      },
    })

    if (!treatment) {
      return { treatment: null, influencers: [] }
    }

    // 해당 시술 경험이 있는 인플루언서 조회
    const collaborations = await prisma.collaborationTreatment.findMany({
      where: { treatmentId: treatment.id },
      include: {
        collaboration: {
          include: {
            influencer: true,
          },
        },
      },
    })

    const influencerMap = new Map<
      string,
      {
        influencer: typeof collaborations[0]['collaboration']['influencer']
        count: number
        lastDate: Date
      }
    >()

    for (const ct of collaborations) {
      const inf = ct.collaboration.influencer
      const existing = influencerMap.get(inf.id)
      if (existing) {
        existing.count++
        if (ct.collaboration.createdAt > existing.lastDate) {
          existing.lastDate = ct.collaboration.createdAt
        }
      } else {
        influencerMap.set(inf.id, {
          influencer: inf,
          count: 1,
          lastDate: ct.collaboration.createdAt,
        })
      }
    }

    return {
      treatment: {
        id: treatment.id,
        name: treatment.name,
        category: treatment.category || '미분류',
      },
      influencers: Array.from(influencerMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item) => ({
          id: item.influencer.id,
          name: item.influencer.name,
          nickname: item.influencer.nickname,
          tier: item.influencer.tier,
          collaborationCount: item.count,
          lastCollaboration: item.lastDate,
        })),
    }
  }

  const treatmentId = treatmentResults[0].treatment_id
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
  })

  // 해당 시술 경험이 있는 인플루언서 조회
  const collaborations = await prisma.collaborationTreatment.findMany({
    where: { treatmentId },
    include: {
      collaboration: {
        include: {
          influencer: true,
        },
      },
    },
  })

  const influencerMap = new Map<
    string,
    {
      influencer: typeof collaborations[0]['collaboration']['influencer']
      count: number
      lastDate: Date
    }
  >()

  for (const ct of collaborations) {
    const inf = ct.collaboration.influencer
    const existing = influencerMap.get(inf.id)
    if (existing) {
      existing.count++
      if (ct.collaboration.createdAt > existing.lastDate) {
        existing.lastDate = ct.collaboration.createdAt
      }
    } else {
      influencerMap.set(inf.id, {
        influencer: inf,
        count: 1,
        lastDate: ct.collaboration.createdAt,
      })
    }
  }

  return {
    treatment: treatment
      ? {
          id: treatment.id,
          name: treatment.name,
          category: treatment.category || '미분류',
        }
      : null,
    influencers: Array.from(influencerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => ({
        id: item.influencer.id,
        name: item.influencer.name,
        nickname: item.influencer.nickname,
        tier: item.influencer.tier,
        collaborationCount: item.count,
        lastCollaboration: item.lastDate,
      })),
  }
}

// 시술 벡터 검색
export async function searchTreatmentsByVector(
  query: string,
  limit: number = 10,
  threshold: number = 0.6
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_treatments', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) throw new Error(`Search failed: ${error.message}`)

  return (data || []).map((item: { treatment_id: string; content: string; similarity: number }) => ({
    id: item.treatment_id,
    content: item.content,
    similarity: item.similarity,
  }))
}

// 콘텐츠 벡터 검색
export async function searchContentsByVector(
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_contents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) throw new Error(`Search failed: ${error.message}`)

  return (data || []).map((item: { content_id: string; content: string; similarity: number }) => ({
    id: item.content_id,
    content: item.content,
    similarity: item.similarity,
  }))
}

// AI 채팅을 위한 컨텍스트 구성
export async function buildChatContext(query: string): Promise<string> {
  const contexts: string[] = []

  // 관련 인플루언서 검색
  try {
    const influencerResults = await searchInfluencersByVector(query, 3, 0.5)
    if (influencerResults.length > 0) {
      contexts.push('## 관련 인플루언서')
      influencerResults.forEach((r) => {
        contexts.push(r.content)
      })
    }
  } catch (e) {
    console.error('Influencer search failed:', e)
  }

  // 관련 시술 검색
  try {
    const treatmentResults = await searchTreatmentsByVector(query, 3, 0.5)
    if (treatmentResults.length > 0) {
      contexts.push('\n## 관련 시술')
      treatmentResults.forEach((r) => {
        contexts.push(r.content)
      })
    }
  } catch (e) {
    console.error('Treatment search failed:', e)
  }

  // 관련 콘텐츠 검색
  try {
    const contentResults = await searchContentsByVector(query, 3, 0.5)
    if (contentResults.length > 0) {
      contexts.push('\n## 관련 콘텐츠')
      contentResults.forEach((r) => {
        contexts.push(r.content)
      })
    }
  } catch (e) {
    console.error('Content search failed:', e)
  }

  return contexts.join('\n')
}

// 대시보드 통계 조회 (AI 도구용)
export async function getDashboardContext(): Promise<string> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalInfluencers,
    influencersByTier,
    activeCampaigns,
    completedThisMonth,
    upcomingSchedules,
    recentContents,
  ] = await Promise.all([
    prisma.influencer.count({ where: { isActive: true } }),
    prisma.influencer.groupBy({
      by: ['tier'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.campaign.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.campaign.count({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: monthStart },
      },
    }),
    prisma.schedule.findMany({
      where: {
        scheduledDate: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      take: 5,
      orderBy: { scheduledDate: 'asc' },
      include: {
        collaboration: {
          include: {
            influencer: true,
            campaign: true,
          },
        },
      },
    }),
    prisma.content.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        collaboration: {
          include: {
            influencer: true,
            campaign: true,
          },
        },
      },
    }),
  ])

  const tierCounts = influencersByTier.reduce(
    (acc, item) => {
      acc[item.tier] = item._count
      return acc
    },
    {} as Record<string, number>
  )

  let context = `## 대시보드 현황

### 인플루언서 현황
- 총 인플루언서: ${totalInfluencers}명
- VIP: ${tierCounts['VIP'] || 0}명
- Gold: ${tierCounts['GOLD'] || 0}명
- Silver: ${tierCounts['SILVER'] || 0}명
- Bronze: ${tierCounts['BRONZE'] || 0}명

### 캠페인 현황
- 진행 중: ${activeCampaigns}개
- 이번 달 완료: ${completedThisMonth}개
`

  if (upcomingSchedules.length > 0) {
    context += '\n### 예정된 일정\n'
    upcomingSchedules.forEach((s) => {
      context += `- ${s.scheduledDate.toLocaleDateString('ko-KR')}: ${s.collaboration.influencer.name} - ${s.type} (${s.collaboration.campaign.name})\n`
    })
  }

  if (recentContents.length > 0) {
    context += '\n### 최근 콘텐츠\n'
    recentContents.forEach((c) => {
      context += `- ${c.title || '제목 없음'} by ${c.collaboration.influencer.name} (조회수: ${c.views.toLocaleString()})\n`
    })
  }

  return context
}
