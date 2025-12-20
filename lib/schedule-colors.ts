// D-day 기반 일정 색상 시스템
import { ScheduleStatus } from '@prisma/client'

export type ScheduleColorType =
  | 'upcoming'      // 다가오는 일정 (D-7 ~ D-4): 초록색
  | 'imminent'      // 임박 (D-3 ~ D-day): 파란색
  | 'overdue'       // 지난 일정 (D+1 이후, 미완료): 빨간색
  | 'rescheduled'   // 일정 변경됨: 노란색
  | 'completed'     // 완료: 회색
  | 'default'       // 기본 (D-7 이후): 기본 타입 색상

export interface ScheduleColorConfig {
  bg: string
  text: string
  border: string
  badge?: string  // 배지용 클래스
}

// D-day 기반 동적 색상
export const SCHEDULE_DYNAMIC_COLORS: Record<ScheduleColorType, ScheduleColorConfig> = {
  upcoming: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    badge: 'bg-green-500',
  },
  imminent: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    badge: 'bg-blue-500',
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    badge: 'bg-red-500',
  },
  rescheduled: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    badge: 'bg-yellow-500',
  },
  completed: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    badge: 'bg-gray-400',
  },
  default: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-400',
  },
}

export interface ScheduleForColor {
  scheduledDate: Date | string
  status: ScheduleStatus | string
  originalDate?: Date | string | null
  completedAt?: Date | string | null
}

/**
 * 일정의 D-day를 기준으로 색상 타입을 결정합니다.
 */
export function getScheduleColorType(schedule: ScheduleForColor): ScheduleColorType {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const scheduledDate = new Date(schedule.scheduledDate)
  scheduledDate.setHours(0, 0, 0, 0)

  const daysUntil = Math.ceil(
    (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // 완료된 일정
  if (schedule.status === 'COMPLETED') {
    return 'completed'
  }

  // 취소된 일정
  if (schedule.status === 'CANCELLED') {
    return 'completed'
  }

  // 일정 변경됨 (originalDate가 있고 현재 날짜와 다름)
  if (schedule.originalDate) {
    const originalDate = new Date(schedule.originalDate)
    originalDate.setHours(0, 0, 0, 0)
    if (originalDate.getTime() !== scheduledDate.getTime()) {
      return 'rescheduled'
    }
  }

  // 지난 일정 (미완료)
  if (daysUntil < 0) {
    return 'overdue'
  }

  // 임박 (D-3 ~ D-day)
  if (daysUntil <= 3) {
    return 'imminent'
  }

  // 다가오는 일정 (D-7 ~ D-4)
  if (daysUntil <= 7) {
    return 'upcoming'
  }

  // 기본
  return 'default'
}

/**
 * 일정의 색상 설정을 반환합니다.
 */
export function getScheduleColor(schedule: ScheduleForColor): ScheduleColorConfig {
  const colorType = getScheduleColorType(schedule)
  return SCHEDULE_DYNAMIC_COLORS[colorType]
}

/**
 * 일정의 색상 클래스를 문자열로 반환합니다.
 */
export function getScheduleColorClasses(schedule: ScheduleForColor): string {
  const colors = getScheduleColor(schedule)
  return `${colors.bg} ${colors.text} ${colors.border}`
}

/**
 * D-day 텍스트를 포맷합니다.
 * @returns "D-Day", "D-3", "D+5" 형식
 */
export function formatDday(schedule: ScheduleForColor): string {
  if (schedule.status === 'COMPLETED' || schedule.status === 'CANCELLED') {
    return schedule.status === 'COMPLETED' ? '완료' : '취소'
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const scheduledDate = new Date(schedule.scheduledDate)
  scheduledDate.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil(
    (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return 'D-Day'
  if (diffDays > 0) return `D-${diffDays}`
  return `D+${Math.abs(diffDays)}`
}

/**
 * 회차를 포맷합니다.
 * @returns "1/3" 또는 null
 */
export function formatRound(
  roundNumber?: number | null,
  totalRounds?: number | null
): string | null {
  if (!roundNumber || !totalRounds) return null
  return `${roundNumber}/${totalRounds}`
}

/**
 * D-day에 따른 우선순위 점수를 반환합니다.
 * 낮을수록 우선순위가 높습니다 (정렬용)
 */
export function getSchedulePriority(schedule: ScheduleForColor): number {
  const colorType = getScheduleColorType(schedule)

  const priorityMap: Record<ScheduleColorType, number> = {
    overdue: 0,      // 가장 높은 우선순위 (지연됨)
    imminent: 1,     // 임박
    upcoming: 2,     // 다가옴
    rescheduled: 3,  // 변경됨
    default: 4,      // 기본
    completed: 5,    // 완료 (가장 낮음)
  }

  return priorityMap[colorType]
}

/**
 * 일정 목록을 우선순위 기준으로 정렬합니다.
 */
export function sortSchedulesByPriority<T extends ScheduleForColor>(
  schedules: T[]
): T[] {
  return [...schedules].sort((a, b) => {
    const priorityDiff = getSchedulePriority(a) - getSchedulePriority(b)
    if (priorityDiff !== 0) return priorityDiff

    // 같은 우선순위면 날짜순
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  })
}
