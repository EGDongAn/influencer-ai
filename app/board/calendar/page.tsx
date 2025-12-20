'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Camera,
  Upload,
  Image,
  Users,
  FileCheck,
  Calendar as CalendarIcon,
  Clock,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'
import {
  type ScheduleWithRelations,
  type ScheduleType,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_COLORS,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
} from '@/lib/types'
import {
  getScheduleColor,
  formatDday,
  formatRound,
  sortSchedulesByPriority,
} from '@/lib/schedule-colors'
import {
  useSchedules,
  invalidateSchedules,
} from '@/lib/hooks/useSchedules'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSchedules, setSelectedSchedules] = useState<ScheduleWithRelations[]>([])

  // SWR 훅 사용 - 현재 달의 일정 조회
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const {
    schedules: allSchedules,
    isLoading: loading,
    isValidating,
  } = useSchedules({ startDate, endDate })

  const schedules = allSchedules as unknown as ScheduleWithRelations[]

  const handleRefresh = () => {
    invalidateSchedules({ startDate, endDate })
  }

  // 달력 데이터 생성
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const days: (Date | null)[] = []

    // 이전 달의 빈 칸
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // 현재 달의 날짜
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }, [currentDate])

  // 날짜별 스케줄 맵
  const schedulesByDate = useMemo(() => {
    const map: Record<string, ScheduleWithRelations[]> = {}
    schedules.forEach((schedule) => {
      const date = new Date(schedule.scheduledDate)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!map[key]) {
        map[key] = []
      }
      map[key].push(schedule)
    })
    return map
  }, [schedules])

  const getSchedulesForDate = (date: Date): ScheduleWithRelations[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return schedulesByDate[key] || []
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const handleDateClick = (date: Date) => {
    const daySchedules = getSchedulesForDate(date)
    if (daySchedules.length > 0) {
      setSelectedDate(date)
      setSelectedSchedules(daySchedules)
    }
  }

  const getTypeIcon = (type: ScheduleType) => {
    switch (type) {
      case 'SHOOTING':
        return <Camera className="h-3 w-3" />
      case 'PROGRESS':
        return <Image className="h-3 w-3" />
      case 'UPLOAD':
        return <Upload className="h-3 w-3" />
      case 'MEETING':
        return <Users className="h-3 w-3" />
      case 'REVIEW':
        return <FileCheck className="h-3 w-3" />
      default:
        return <CalendarIcon className="h-3 w-3" />
    }
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 이번 주 일정
  const thisWeekSchedules = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    return schedules.filter((schedule) => {
      const date = new Date(schedule.scheduledDate)
      return date >= startOfWeek && date < endOfWeek
    })
  }, [schedules])

  // 날짜별로 그룹화
  const groupedWeekSchedules = useMemo(() => {
    return thisWeekSchedules.reduce((acc, schedule) => {
      const dateKey = new Date(schedule.scheduledDate).toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(schedule)
      return acc
    }, {} as Record<string, ScheduleWithRelations[]>)
  }, [thisWeekSchedules])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">일정 캘린더</h1>
          <p className="text-gray-600 mt-1">
            촬영, 경과사진, 업로드 일정을 한눈에 확인하세요
            {isValidating && (
              <span className="ml-2 text-blue-500 text-sm">
                <RefreshCw className="h-3 w-3 inline animate-spin mr-1" />
                동기화 중...
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isValidating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Link href="/board/kanban">
            <Button variant="outline">
              <LayoutGrid className="h-4 w-4 mr-2" />
              칸반 보기
            </Button>
          </Link>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4">
        {(Object.keys(SCHEDULE_TYPE_LABELS) as ScheduleType[]).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border ${SCHEDULE_TYPE_COLORS[type]}`} />
            <span className="text-sm">{SCHEDULE_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </CardTitle>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={goToToday}>
              오늘
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {calendarDays.map((date, index) => {
              const daySchedules = date ? getSchedulesForDate(date) : []
              const hasMore = daySchedules.length > 3

              return (
                <div
                  key={index}
                  className={`min-h-[120px] bg-white p-2 ${
                    date && isToday(date) ? 'bg-blue-50' : ''
                  } ${date && daySchedules.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => date && daySchedules.length > 0 && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          date.getDay() === 0
                            ? 'text-red-500'
                            : date.getDay() === 6
                            ? 'text-blue-500'
                            : ''
                        } ${isToday(date) ? 'text-blue-600 font-bold' : ''}`}
                      >
                        {date.getDate()}
                        {daySchedules.length > 0 && (
                          <span className="ml-1 text-xs text-gray-400">
                            ({daySchedules.length})
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {sortSchedulesByPriority(daySchedules).slice(0, 3).map((schedule) => {
                          const colorConfig = getScheduleColor(schedule)
                          const ddayText = formatDday(schedule)
                          const roundText = formatRound(
                            schedule.roundNumber,
                            schedule.totalRounds
                          )
                          return (
                            <div
                              key={schedule.id}
                              className={`text-xs p-1 rounded border truncate ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                            >
                              <div className="flex items-center gap-1">
                                {getTypeIcon(schedule.type)}
                                <span className="truncate flex-1">
                                  {schedule.title || schedule.collaboration.influencer.name}
                                  {roundText && ` (${roundText})`}
                                </span>
                                <span className="font-semibold text-[10px]">
                                  {ddayText}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        {hasMore && (
                          <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                            <MoreHorizontal className="h-3 w-3" />
                            +{daySchedules.length - 3}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 이번 주 일정 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            이번 주 일정
          </CardTitle>
        </CardHeader>
        <CardContent>
          {thisWeekSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이번 주에 예정된 일정이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedWeekSchedules)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([dateKey, dateSchedules]) => (
                  <div key={dateKey}>
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      {new Date(dateKey).toLocaleDateString('ko-KR', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="space-y-2">
                      {sortSchedulesByPriority(dateSchedules).map((schedule) => {
                        const colorConfig = getScheduleColor(schedule)
                        const ddayText = formatDday(schedule)
                        const roundText = formatRound(
                          schedule.roundNumber,
                          schedule.totalRounds
                        )
                        return (
                          <div
                            key={schedule.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${colorConfig.bg} ${colorConfig.border}`}
                          >
                            <Badge className={`${colorConfig.badge} text-white`}>
                              {getTypeIcon(schedule.type)}
                              <span className="ml-1">
                                {SCHEDULE_TYPE_LABELS[schedule.type]}
                                {roundText && ` (${roundText})`}
                              </span>
                            </Badge>
                            <span className={`font-bold text-sm ${colorConfig.text}`}>
                              {ddayText}
                            </span>
                            {schedule.scheduledTime && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                {schedule.scheduledTime}
                              </div>
                            )}
                            <div className="flex-1">
                              <Link
                                href={`/influencers/${schedule.collaboration.influencer.id}`}
                                className="font-medium hover:underline"
                              >
                                {schedule.collaboration.influencer.nickname || schedule.collaboration.influencer.name}
                              </Link>
                              {schedule.title && (
                                <span className="text-gray-500 ml-2">- {schedule.title}</span>
                              )}
                            </div>
                            <Badge className={SCHEDULE_STATUS_COLORS[schedule.status]}>
                              {SCHEDULE_STATUS_LABELS[schedule.status]}
                            </Badge>
                            <Link
                              href={`/campaigns/${schedule.collaboration.campaign.id}`}
                              className="text-sm text-gray-500 hover:underline"
                            >
                              {schedule.collaboration.campaign.name}
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 날짜 상세 다이얼로그 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {sortSchedulesByPriority(selectedSchedules).map((schedule) => {
              const colorConfig = getScheduleColor(schedule)
              const ddayText = formatDday(schedule)
              const roundText = formatRound(
                schedule.roundNumber,
                schedule.totalRounds
              )
              return (
                <div
                  key={schedule.id}
                  className={`p-3 rounded-lg border space-y-2 ${colorConfig.bg} ${colorConfig.border}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${colorConfig.badge} text-white`}>
                        {getTypeIcon(schedule.type)}
                        <span className="ml-1">
                          {SCHEDULE_TYPE_LABELS[schedule.type]}
                          {roundText && ` (${roundText})`}
                        </span>
                      </Badge>
                      <span className={`font-bold text-sm ${colorConfig.text}`}>
                        {ddayText}
                      </span>
                    </div>
                    <Badge className={SCHEDULE_STATUS_COLORS[schedule.status]}>
                      {SCHEDULE_STATUS_LABELS[schedule.status]}
                    </Badge>
                  </div>
                  {schedule.scheduledTime && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {schedule.scheduledTime}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/influencers/${schedule.collaboration.influencer.id}`}
                      className="font-medium hover:underline"
                    >
                      {schedule.collaboration.influencer.nickname || schedule.collaboration.influencer.name}
                    </Link>
                    <Link
                      href={`/campaigns/${schedule.collaboration.campaign.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {schedule.collaboration.campaign.name}
                    </Link>
                  </div>
                  {schedule.title && (
                    <div className="text-sm text-gray-600">{schedule.title}</div>
                  )}
                  {schedule.notes && (
                    <div className="text-sm text-gray-500 bg-white/50 p-2 rounded">
                      {schedule.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
