// SWR 기반 협업 데이터 훅
import useSWR, { mutate } from 'swr'

export interface CollaborationQueryOptions {
  campaignId?: string
  influencerId?: string
  status?: string
}

export interface Collaboration {
  id: string
  campaignId: string
  influencerId: string
  fee: number | null
  feeType: 'FIXED' | 'PER_CONTENT' | 'REVENUE_SHARE' | 'BARTER'
  shootingRounds: number
  progressRounds: number
  status: 'CONTACTED' | 'NEGOTIATING' | 'CONFIRMED' | 'SHOOTING_DONE' | 'PROGRESS_DONE' | 'UPLOADED' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  createdAt: string
  updatedAt: string
  influencer: {
    id: string
    name: string
    nickname: string | null
    tier: string
    profileImageUrl: string | null
    channels: Array<{
      id: string
      platform: string
      handle: string
      followerCount: number | null
    }>
  }
  campaign: {
    id: string
    name: string
    clientName: string
    status: string
  }
  schedules: Array<{
    id: string
    type: string
    roundNumber: number | null
    totalRounds: number | null
    scheduledDate: string
    status: string
    completedAt: string | null
  }>
  treatments: Array<{
    id: string
    treatment: {
      id: string
      name: string
      nameKo: string | null
    }
    notes: string | null
  }>
  contents: Array<{
    id: string
    title: string | null
    url: string
    contentType: string
    views: number
    likes: number
  }>
  _count?: {
    schedules: number
    contents: number
    treatments: number
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('협업 데이터를 불러오는데 실패했습니다.')
  }
  return res.json()
}

function buildQueryString(options: CollaborationQueryOptions): string {
  const params = new URLSearchParams()

  if (options.campaignId) params.append('campaignId', options.campaignId)
  if (options.influencerId) params.append('influencerId', options.influencerId)
  if (options.status) params.append('status', options.status)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export function useCollaborations(options: CollaborationQueryOptions = {}) {
  const queryString = buildQueryString(options)
  const { data, error, isLoading, isValidating } = useSWR<Collaboration[]>(
    `/api/collaborations${queryString}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      refreshInterval: 30000,
    }
  )

  return {
    collaborations: data || [],
    isLoading,
    isValidating,
    error,
  }
}

export function useCollaboration(id: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<Collaboration>(
    id ? `/api/collaborations/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  return {
    collaboration: data,
    isLoading,
    isValidating,
    error,
  }
}

// 칸반 보드용 그룹화된 협업 데이터
export function useKanbanCollaborations() {
  const { collaborations, isLoading, isValidating, error } = useCollaborations()

  const groupedByStatus = collaborations.reduce(
    (acc, collab) => {
      const status = collab.status
      if (!acc[status]) acc[status] = []
      acc[status].push(collab)
      return acc
    },
    {} as Record<string, Collaboration[]>
  )

  return {
    collaborations,
    groupedByStatus,
    isLoading,
    isValidating,
    error,
  }
}

// 협업 캐시 무효화 함수들
export function invalidateCollaborations(options?: CollaborationQueryOptions) {
  if (options) {
    const queryString = buildQueryString(options)
    mutate(`/api/collaborations${queryString}`)
  } else {
    mutate((key) => typeof key === 'string' && key.startsWith('/api/collaborations'))
  }
}

export function invalidateCollaboration(id: string) {
  mutate(`/api/collaborations/${id}`)
}

// 협업 생성
export async function createCollaboration(data: {
  campaignId: string
  influencerId: string
  fee?: number
  feeType?: string
  shootingRounds?: number
  progressRounds?: number
  treatmentIds?: string[]
  createSchedules?: boolean
  notes?: string
}) {
  const res = await fetch('/api/collaborations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '협업 생성에 실패했습니다.')
  }

  const collaboration = await res.json()
  invalidateCollaborations()
  // 스케줄도 갱신
  mutate((key) => typeof key === 'string' && key.startsWith('/api/schedules'))
  return collaboration
}

// 협업 수정
export async function updateCollaboration(id: string, data: Partial<Collaboration>) {
  const res = await fetch(`/api/collaborations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '협업 수정에 실패했습니다.')
  }

  const collaboration = await res.json()
  invalidateCollaboration(id)
  invalidateCollaborations()
  return collaboration
}

// 협업 삭제
export async function deleteCollaboration(id: string) {
  const res = await fetch(`/api/collaborations/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '협업 삭제에 실패했습니다.')
  }

  invalidateCollaborations()
  // 스케줄도 갱신 (cascade delete)
  mutate((key) => typeof key === 'string' && key.startsWith('/api/schedules'))
}

// 협업 상태 변경
export async function updateCollaborationStatus(
  id: string,
  status: Collaboration['status']
) {
  return updateCollaboration(id, { status })
}
