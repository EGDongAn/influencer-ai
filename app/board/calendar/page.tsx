'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Camera,
  Upload,
  Image,
} from 'lucide-react'
import {
  type CollaborationWithRelations,
  TIER_COLORS,
} from '@/lib/types'

interface CalendarEvent {
  id: string
  type: 'shooting' | 'progress' | 'upload'
  date: Date
  collaboration: CollaborationWithRelations
}

export default function CalendarPage() {
  const [collaborations, setCollaborations] = useState<
    CollaborationWithRelations[]
  >([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchCollaborations()
  }, [])

  const fetchCollaborations = async () => {
    try {
      const response = await fetch('/api/collaborations')
      const data = await response.json()
      setCollaborations(data)
    } catch (error) {
      console.error('Failed to fetch collaborations:', error)
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 생성
  const getEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    collaborations.forEach((collab) => {
      if (collab.shootingDate) {
        events.push({
          id: `${collab.id}-shooting`,
          type: 'shooting',
          date: new Date(collab.shootingDate),
          collaboration: collab,
        })
      }
      if (collab.progressDate) {
        events.push({
          id: `${collab.id}-progress`,
          type: 'progress',
          date: new Date(collab.progressDate),
          collaboration: collab,
        })
      }
      if (collab.uploadDeadline) {
        events.push({
          id: `${collab.id}-upload`,
          type: 'upload',
          date: new Date(collab.uploadDeadline),
          collaboration: collab,
        })
      }
    })

    return events
  }

  // 달력 데이터 생성
  const getCalendarDays = () => {
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
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events = getEvents()
    return events.filter(
      (event) =>
        event.date.getFullYear() === date.getFullYear() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getDate() === date.getDate()
    )
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

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'shooting':
        return <Camera className="h-3 w-3" />
      case 'progress':
        return <Image className="h-3 w-3" />
      case 'upload':
        return <Upload className="h-3 w-3" />
    }
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'shooting':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'progress':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'upload':
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getEventLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'shooting':
        return '촬영'
      case 'progress':
        return '경과'
      case 'upload':
        return '업로드'
    }
  }

  const days = getCalendarDays()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

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
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/board/kanban">
            <Button variant="outline">
              <LayoutGrid className="h-4 w-4 mr-2" />
              칸반 보기
            </Button>
          </Link>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
          <span className="text-sm">촬영</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded" />
          <span className="text-sm">경과사진</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
          <span className="text-sm">업로드</span>
        </div>
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
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map((date, index) => (
              <div
                key={index}
                className={`min-h-[120px] bg-white p-2 ${
                  date && isToday(date) ? 'bg-blue-50' : ''
                }`}
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
                    </div>
                    <div className="space-y-1">
                      {getEventsForDate(date)
                        .slice(0, 3)
                        .map((event) => (
                          <Link
                            key={event.id}
                            href={`/campaigns/${event.collaboration.campaign.id}`}
                            className={`block text-xs p-1 rounded border truncate hover:opacity-80 ${getEventColor(
                              event.type
                            )}`}
                          >
                            <div className="flex items-center gap-1">
                              {getEventIcon(event.type)}
                              <span className="truncate">
                                {event.collaboration.influencer.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      {getEventsForDate(date).length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{getEventsForDate(date).length - 3}개 더
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 이번 주 일정 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>이번 주 일정</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const today = new Date()
            const startOfWeek = new Date(today)
            startOfWeek.setDate(today.getDate() - today.getDay())
            startOfWeek.setHours(0, 0, 0, 0)

            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 7)

            const weekEvents = getEvents().filter(
              (event) => event.date >= startOfWeek && event.date < endOfWeek
            )

            if (weekEvents.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  이번 주에 예정된 일정이 없습니다.
                </div>
              )
            }

            // 날짜별로 그룹화
            const groupedEvents = weekEvents.reduce((acc, event) => {
              const dateKey = event.date.toDateString()
              if (!acc[dateKey]) {
                acc[dateKey] = []
              }
              acc[dateKey].push(event)
              return acc
            }, {} as Record<string, CalendarEvent[]>)

            return (
              <div className="space-y-4">
                {Object.entries(groupedEvents)
                  .sort(
                    ([a], [b]) =>
                      new Date(a).getTime() - new Date(b).getTime()
                  )
                  .map(([dateKey, events]) => (
                    <div key={dateKey}>
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        {new Date(dateKey).toLocaleDateString('ko-KR', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-2 border rounded-lg"
                          >
                            <Badge className={getEventColor(event.type)}>
                              {getEventIcon(event.type)}
                              <span className="ml-1">
                                {getEventLabel(event.type)}
                              </span>
                            </Badge>
                            <div className="flex-1">
                              <Link
                                href={`/influencers/${event.collaboration.influencer.id}`}
                                className="font-medium hover:underline"
                              >
                                {event.collaboration.influencer.name}
                              </Link>
                              <Badge
                                className={`ml-2 ${
                                  TIER_COLORS[event.collaboration.influencer.tier]
                                }`}
                              >
                                {event.collaboration.influencer.tier}
                              </Badge>
                            </div>
                            <Link
                              href={`/campaigns/${event.collaboration.campaign.id}`}
                              className="text-sm text-gray-500 hover:underline"
                            >
                              {event.collaboration.campaign.name}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
