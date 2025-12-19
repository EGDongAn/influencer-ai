'use client'

import { useEffect, useState } from 'react'
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
import { Calendar, User, Megaphone, GripVertical } from 'lucide-react'
import {
  type CollaborationWithRelations,
  type CollaborationStatus,
  COLLABORATION_STATUS_LABELS,
  COLLABORATION_STATUS_COLORS,
  TIER_LABELS,
  TIER_COLORS,
} from '@/lib/types'

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
  const [collaborations, setCollaborations] = useState<
    CollaborationWithRelations[]
  >([])
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  useEffect(() => {
    fetchCollaborations()
  }, [])

  const fetchCollaborations = async () => {
    try {
      const response = await fetch('/api/collaborations')
      const data = await response.json()
      // 취소된 항목 제외
      setCollaborations(
        data.filter((c: CollaborationWithRelations) => c.status !== 'CANCELLED')
      )
    } catch (error) {
      console.error('Failed to fetch collaborations:', error)
    } finally {
      setLoading(false)
    }
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
      const response = await fetch(`/api/collaborations/${draggedItem}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setCollaborations((prev) =>
          prev.map((c) =>
            c.id === draggedItem ? { ...c, status: newStatus } : c
          )
        )
      }
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
      const response = await fetch(`/api/collaborations/${collaborationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setCollaborations((prev) =>
          prev.map((c) =>
            c.id === collaborationId ? { ...c, status: newStatus } : c
          )
        )
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getColumnCollaborations = (status: CollaborationStatus) => {
    return collaborations.filter((c) => c.status === status)
  }

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
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/board/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              캘린더 보기
            </Button>
          </Link>
        </div>
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
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {column.label}
                    </CardTitle>
                    <Badge variant="secondary">
                      {getColumnCollaborations(column.status).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[400px]">
                  {getColumnCollaborations(column.status).map((collab) => (
                    <div
                      key={collab.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, collab.id)}
                      className={`p-3 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
                        draggedItem === collab.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {/* 인플루언서 정보 */}
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <Link
                              href={`/influencers/${collab.influencer.id}`}
                              className="font-medium text-sm hover:underline truncate"
                            >
                              {collab.influencer.name}
                            </Link>
                            <Badge
                              className={`${
                                TIER_COLORS[collab.influencer.tier]
                              } text-xs`}
                            >
                              {TIER_LABELS[collab.influencer.tier]}
                            </Badge>
                          </div>

                          {/* 캠페인 정보 */}
                          <Link
                            href={`/campaigns/${collab.campaign.id}`}
                            className="text-xs text-gray-500 hover:underline block truncate"
                          >
                            <Megaphone className="h-3 w-3 inline mr-1" />
                            {collab.campaign.name}
                          </Link>

                          {/* 일정 정보 */}
                          <div className="mt-2 space-y-1">
                            {collab.shootingDate && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                촬영: {formatDate(collab.shootingDate)}
                              </div>
                            )}
                            {collab.uploadDeadline && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                마감: {formatDate(collab.uploadDeadline)}
                              </div>
                            )}
                          </div>

                          {/* 상태 변경 드롭다운 */}
                          <div className="mt-3">
                            <Select
                              value={collab.status}
                              onValueChange={(value: CollaborationStatus) =>
                                handleStatusChange(collab.id, value)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <Badge
                                  className={`${
                                    COLLABORATION_STATUS_COLORS[collab.status]
                                  } text-xs`}
                                >
                                  {COLLABORATION_STATUS_LABELS[collab.status]}
                                </Badge>
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
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
