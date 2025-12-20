'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  User,
  Megaphone,
  GripVertical,
  Camera,
  Upload,
  Image,
  Users,
  FileCheck,
  Clock,
  Plus,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import {
  type CollaborationWithRelations,
  type CollaborationStatus,
  type ScheduleWithRelations,
  type ScheduleType,
  COLLABORATION_STATUS_LABELS,
  COLLABORATION_STATUS_COLORS,
  TIER_LABELS,
  TIER_COLORS,
  SCHEDULE_TYPE_LABELS,
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
  useCollaborations,
  updateCollaborationStatus,
  invalidateCollaborations,
} from '@/lib/hooks/useCollaborations'
import {
  useSchedules,
  invalidateSchedules,
} from '@/lib/hooks/useSchedules'

// 칸반 컬럼 정의
const KANBAN_COLUMNS: { status: CollaborationStatus; label: string }[] = [
  { status: 'CONTACTED', label: '컨택 완료' },
  { status: 'NEGOTIATING', label: '협의 중' },
  { status: 'CONFIRMED', label: '확정' },
  { status: 'SHOOTING_DONE', label: '촬영 완료' },
  { status: 'PROGRESS_DONE', label: '경과사진 완료' },
  { status: 'UPLOADED', label: '업로드 완료' },
  { status: 'COMPLETED', label: '협업 완료' },
]

export default function KanbanBoardPage() {
  // SWR 훅 사용
  const {
    collaborations: allCollaborations,
    isLoading: collabLoading,
    isValidating: collabValidating,
  } = useCollaborations()
  const {
    schedules: allSchedules,
    isLoading: scheduleLoading,
    isValidating: scheduleValidating,
  } = useSchedules()

  const collaborations = useMemo(
    () => (allCollaborations.filter((c) => c.status !== 'CANCELLED') as unknown) as CollaborationWithRelations[],
    [allCollaborations]
  )
  const schedules = allSchedules as unknown as ScheduleWithRelations[]

  const loading = collabLoading || scheduleLoading
  const isValidating = collabValidating || scheduleValidating

  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [selectedCollab, setSelectedCollab] = useState<CollaborationWithRelations | null>(null)
  const [collabSchedules, setCollabSchedules] = useState<ScheduleWithRelations[]>([])

  const handleRefresh = () => {
    invalidateCollaborations()
    invalidateSchedules()
  }

  // 협업별 일정 맵
  const schedulesByCollaboration = useMemo(() => {
    const map: Record<string, ScheduleWithRelations[]> = {}
    schedules.forEach((schedule) => {
      const collabId = schedule.collaborationId
      if (!map[collabId]) {
        map[collabId] = []
      }
      map[collabId].push(schedule)
    })
    // 각 협업의 일정을 우선순위순으로 정렬 (D-day 기반)
    Object.keys(map).forEach((key) => {
      map[key] = sortSchedulesByPriority(map[key])
    })
    return map
  }, [schedules])

  const getCollabSchedules = (collaborationId: string): ScheduleWithRelations[] => {
    return schedulesByCollaboration[collaborationId] || []
  }

  const getUpcomingSchedule = (collaborationId: string): ScheduleWithRelations | null => {
    const collabSchedules = getCollabSchedules(collaborationId)
    const now = new Date()
    return (
      collabSchedules.find(
        (s) => new Date(s.scheduledDate) >= now && s.status !== 'COMPLETED' && s.status !== 'CANCELLED'
      ) || null
    )
  }

  const handleDragStart = (e: React.DragEvent, collaborationId: string) => {
    setDraggedItem(collaborationId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: CollaborationStatus) => {
    e.preventDefault()
    if (!draggedItem) return

    try {
      await updateCollaborationStatus(draggedItem, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setDraggedItem(null)
    }
  }

  const handleStatusChange = async (
    collaborationId: string,
    newStatus: CollaborationStatus
  ) => {
    try {
      await updateCollaborationStatus(collaborationId, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleCardClick = (collab: CollaborationWithRelations) => {
    setSelectedCollab(collab)
    setCollabSchedules(getCollabSchedules(collab.id))
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date | string, time?: string | null) => {
    const d = new Date(date)
    const dateStr = d.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
    return time ? `${dateStr} ${time}` : dateStr
  }

  const getColumnCollaborations = (status: CollaborationStatus) => {
    return collaborations.filter((c) => c.status === status)
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
        return <Calendar className="h-3 w-3" />
    }
  }

  // 통계 계산
  const stats = useMemo(() => {
    const total = collaborations.length
    const byStatus = KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col.status] = getColumnCollaborations(col.status).length
      return acc
    }, {} as Record<string, number>)

    const upcomingCount = collaborations.filter(
      (c) => getUpcomingSchedule(c.id) !== null
    ).length

    return { total, byStatus, upcomingCount }
  }, [collaborations, schedulesByCollaboration])

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
          <h1 className="text-3xl font-bold">칸반 보드</h1>
          <p className="text-gray-600 mt-1">
            협업 진행 상태를 드래그 앤 드롭으로 관리하세요
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
          <Link href="/board/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              캘린더 보기
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">전체 협업</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.byStatus['NEGOTIATING'] || 0}
            </div>
            <div className="text-sm text-gray-500">협의 중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.byStatus['CONFIRMED'] || 0}
            </div>
            <div className="text-sm text-gray-500">확정</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.upcomingCount}
            </div>
            <div className="text-sm text-gray-500">예정된 일정</div>
          </CardContent>
        </Card>
      </div>

      {collaborations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>진행 중인 협업이 없습니다.</p>
            <p className="text-sm mt-2">
              캠페인에서 인플루언서를 추가하면 여기에 표시됩니다.
            </p>
            <Link href="/campaigns">
              <Button className="mt-4" variant="outline">
                캠페인 관리로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <div
              key={column.status}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <Card className="h-full bg-gray-50">
                <CardHeader className="pb-3 bg-white rounded-t-lg border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          COLLABORATION_STATUS_COLORS[column.status]
                            .replace('bg-', 'bg-')
                            .split(' ')[0]
                        }`}
                      />
                      {column.label}
                    </CardTitle>
                    <Badge variant="secondary" className="font-bold">
                      {getColumnCollaborations(column.status).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[500px] p-3">
                  {getColumnCollaborations(column.status).map((collab) => {
                    const collabScheduleList = getCollabSchedules(collab.id)
                    const upcomingSchedule = getUpcomingSchedule(collab.id)

                    return (
                      <div
                        key={collab.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, collab.id)}
                        onClick={() => handleCardClick(collab)}
                        className={`p-3 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-all hover:border-blue-300 ${
                          draggedItem === collab.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-gray-300 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {/* 인플루언서 정보 */}
                            <div className="flex items-center gap-2 mb-2">
                              <Link
                                href={`/influencers/${collab.influencer.id}`}
                                className="font-medium text-sm hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {collab.influencer.nickname || collab.influencer.name}
                              </Link>
                              <Badge
                                className={`${TIER_COLORS[collab.influencer.tier]} text-xs`}
                              >
                                {TIER_LABELS[collab.influencer.tier]}
                              </Badge>
                            </div>

                            {/* 캠페인 정보 */}
                            <Link
                              href={`/campaigns/${collab.campaign.id}`}
                              className="text-xs text-gray-500 hover:underline block truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Megaphone className="h-3 w-3 inline mr-1" />
                              {collab.campaign.name}
                            </Link>

                            {/* 일정 정보 - D-day 기반 동적 색상 */}
                            {collabScheduleList.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {upcomingSchedule ? (
                                  (() => {
                                    const colorConfig = getScheduleColor(upcomingSchedule)
                                    const ddayText = formatDday(upcomingSchedule)
                                    const roundText = formatRound(
                                      upcomingSchedule.roundNumber,
                                      upcomingSchedule.totalRounds
                                    )
                                    return (
                                      <div
                                        className={`text-xs p-1.5 rounded border flex items-center gap-1.5 ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                                      >
                                        {getTypeIcon(upcomingSchedule.type)}
                                        <span>
                                          {SCHEDULE_TYPE_LABELS[upcomingSchedule.type]}
                                          {roundText && ` (${roundText})`}
                                        </span>
                                        <span className="ml-auto font-medium">
                                          {ddayText}
                                        </span>
                                      </div>
                                    )
                                  })()
                                ) : (
                                  <div className="text-xs text-gray-400">
                                    예정된 일정 없음
                                  </div>
                                )}
                                {collabScheduleList.length > 1 && (
                                  <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <ChevronDown className="h-3 w-3" />
                                    외 {collabScheduleList.length - 1}개 일정
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 상태 변경 드롭다운 */}
                            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={collab.status}
                                onValueChange={(value: CollaborationStatus) =>
                                  handleStatusChange(collab.id, value)
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue>
                                    <Badge
                                      className={`${
                                        COLLABORATION_STATUS_COLORS[collab.status]
                                      } text-xs`}
                                    >
                                      {COLLABORATION_STATUS_LABELS[collab.status]}
                                    </Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {KANBAN_COLUMNS.map((col) => (
                                    <SelectItem key={col.status} value={col.status}>
                                      {col.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* 협업 상세 다이얼로그 */}
      <Dialog open={!!selectedCollab} onOpenChange={() => setSelectedCollab(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCollab?.influencer.nickname || selectedCollab?.influencer.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCollab && (
            <div className="space-y-4">
              {/* 협업 정보 */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/campaigns/${selectedCollab.campaign.id}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Megaphone className="h-4 w-4" />
                  {selectedCollab.campaign.name}
                </Link>
                <Badge className={COLLABORATION_STATUS_COLORS[selectedCollab.status]}>
                  {COLLABORATION_STATUS_LABELS[selectedCollab.status]}
                </Badge>
              </div>

              {/* 일정 목록 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">일정 목록</h4>
                  <Link
                    href={`/campaigns/${selectedCollab.campaign.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    일정 추가
                  </Link>
                </div>
                {collabSchedules.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm border rounded-lg">
                    등록된 일정이 없습니다
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {collabSchedules.map((schedule) => {
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
                              <span className={`text-sm font-bold ${colorConfig.text}`}>
                                {ddayText}
                              </span>
                            </div>
                            <Badge className={SCHEDULE_STATUS_COLORS[schedule.status]}>
                              {SCHEDULE_STATUS_LABELS[schedule.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(
                              schedule.scheduledDate,
                              schedule.scheduledTime
                            )}
                          </div>
                          {schedule.title && (
                            <div className="text-sm font-medium">{schedule.title}</div>
                          )}
                          {schedule.notes && (
                            <div className="text-xs text-gray-500 bg-white/50 p-2 rounded">
                              {schedule.notes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-2 border-t">
                <Link
                  href={`/influencers/${selectedCollab.influencer.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    인플루언서 상세
                  </Button>
                </Link>
                <Link
                  href={`/campaigns/${selectedCollab.campaign.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <Megaphone className="h-4 w-4 mr-2" />
                    캠페인 상세
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
