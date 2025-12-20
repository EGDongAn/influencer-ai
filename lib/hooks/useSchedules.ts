// SWR 기반 스케줄 데이터 훅
import useSWR, { mutate } from 'swr'

export interface ScheduleQueryOptions {
  campaignId?: string
  collaborationId?: string
  influencerId?: string
  startDate?: string
  endDate?: string
  status?: string
  type?: string
}

export interface Schedule {
  id: string
  collaborationId: string
  type: 'SHOOTING' | 'PROGRESS' | 'UPLOAD' | 'MEETING' | 'REVIEW' | 'OTHER'
  title: string | null
  roundNumber: number | null
  totalRounds: number | null
  scheduledDate: string
  scheduledTime: string | null
  originalDate: string | null
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  completedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  collaboration: {
    id: string
    status: string
    influencer: {
      id: string
      name: string
      nickname: string | null
      tier: string
    }
    campaign: {
      id: string
      name: string
      clientName: string
    }
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('스케줄을 불러오는데 실패했습니다.')
    throw error
  }
  return res.json()
}

function buildQueryString(options: ScheduleQueryOptions): string {
  const params = new URLSearchParams()

  if (options.campaignId) params.append('campaignId', options.campaignId)
  if (options.collaborationId) params.append('collaborationId', options.collaborationId)
  if (options.influencerId) params.append('influencerId', options.influencerId)
  if (options.startDate) params.append('startDate', options.startDate)
  if (options.endDate) params.append('endDate', options.endDate)
  if (options.status) params.append('status', options.status)
  if (options.type) params.append('type', options.type)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export function useSchedules(options: ScheduleQueryOptions = {}) {
  const queryString = buildQueryString(options)
  const { data, error, isLoading, isValidating } = useSWR<Schedule[]>(
    `/api/schedules${queryString}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // 30초마다 자동 갱신
    }
  )

  return {
    schedules: data || [],
    isLoading,
    isValidating,
    error,
  }
}

export function useSchedule(id: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<Schedule>(
    id ? `/api/schedules/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  return {
    schedule: data,
    isLoading,
    isValidating,
    error,
  }
}

// 스케줄 캐시 무효화 함수들
export function invalidateSchedules(options?: ScheduleQueryOptions) {
  if (options) {
    const queryString = buildQueryString(options)
    mutate(`/api/schedules${queryString}`)
  } else {
    // 모든 스케줄 관련 캐시 무효화
    mutate((key) => typeof key === 'string' && key.startsWith('/api/schedules'))
  }
}

export function invalidateSchedule(id: string) {
  mutate(`/api/schedules/${id}`)
}

// 스케줄 생성
export async function createSchedule(data: Partial<Schedule>) {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '스케줄 생성에 실패했습니다.')
  }

  const schedule = await res.json()
  invalidateSchedules()
  return schedule
}

// 스케줄 수정
export async function updateSchedule(id: string, data: Partial<Schedule>) {
  const res = await fetch(`/api/schedules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '스케줄 수정에 실패했습니다.')
  }

  const schedule = await res.json()
  invalidateSchedule(id)
  invalidateSchedules()
  return schedule
}

// 스케줄 삭제
export async function deleteSchedule(id: string) {
  const res = await fetch(`/api/schedules/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '스케줄 삭제에 실패했습니다.')
  }

  invalidateSchedules()
}

// 스케줄 상태 변경
export async function updateScheduleStatus(
  id: string,
  status: Schedule['status'],
  completedAt?: string
) {
  return updateSchedule(id, {
    status,
    completedAt: status === 'COMPLETED' ? (completedAt || new Date().toISOString()) : null
  })
}
