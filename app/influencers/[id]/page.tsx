'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Camera,
  Upload,
  Image,
  Users,
  FileCheck,
  Clock,
} from 'lucide-react'
import {
  type InfluencerWithCollaborations,
  type ScheduleWithRelations,
  type ScheduleType,
  TIER_LABELS,
  TIER_COLORS,
  PLATFORM_LABELS,
  COLLABORATION_STATUS_LABELS,
  COLLABORATION_STATUS_COLORS,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_COLORS,
} from '@/lib/types'

export default function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [influencer, setInfluencer] = useState<InfluencerWithCollaborations | null>(null)
  const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/influencers/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInfluencer(data)

        // 인플루언서의 모든 협업 ID를 가져와서 일정 조회
        if (data.collaborations && data.collaborations.length > 0) {
          const collabIds = data.collaborations.map((c: { id: string }) => c.id)
          const schedulesPromises = collabIds.map((collabId: string) =>
            fetch(`/api/schedules?collaborationId=${collabId}`).then((res) => res.json())
          )
          const schedulesResults = await Promise.all(schedulesPromises)
          const allSchedules = schedulesResults.flat().filter(Array.isArray)
            ? schedulesResults.flat()
            : []
          setSchedules(allSchedules)
        }
      } else {
        router.push('/influencers')
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      router.push('/influencers')
    } finally {
      setLoading(false)
    }
  }

  const getCollabSchedules = (collaborationId: string): ScheduleWithRelations[] => {
    return schedules
      .filter((s) => s.collaborationId === collaborationId)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }

  const getNextSchedule = (collaborationId: string): ScheduleWithRelations | null => {
    const collabSchedules = getCollabSchedules(collaborationId)
    const now = new Date()
    return (
      collabSchedules.find(
        (s) => new Date(s.scheduledDate) >= now && s.status !== 'COMPLETED' && s.status !== 'CANCELLED'
      ) || null
    )
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/influencers/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/influencers')
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
    }
  }

  const formatFollowers = (count: number | null) => {
    if (!count) return '-'
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
    return count.toString()
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!influencer) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/influencers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{influencer.name}</h1>
              <Badge className={TIER_COLORS[influencer.tier]}>
                {TIER_LABELS[influencer.tier]}
              </Badge>
            </div>
            {influencer.nickname && (
              <p className="text-gray-600 mt-1">@{influencer.nickname}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/influencers/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          </Link>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>인플루언서 삭제</DialogTitle>
                <DialogDescription>
                  정말로 {influencer.name}님을 삭제하시겠습니까? 이 작업은 되돌릴 수
                  없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  취소
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {influencer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{influencer.email}</span>
                </div>
              )}
              {influencer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{influencer.phone}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">카테고리</h4>
              <div className="flex flex-wrap gap-2">
                {influencer.category.length > 0 ? (
                  influencer.category.map((cat) => (
                    <Badge key={cat} variant="outline">
                      {cat}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>

            {influencer.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">메모</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {influencer.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 채널 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>채널</CardTitle>
          </CardHeader>
          <CardContent>
            {influencer.channels.length === 0 ? (
              <p className="text-gray-400 text-center py-4">등록된 채널이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {influencer.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="p-3 border rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {PLATFORM_LABELS[channel.platform]}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatFollowers(channel.followerCount)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{channel.handle}</div>
                    {channel.url && (
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        채널 방문
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 협업 이력 */}
      <Card>
        <CardHeader>
          <CardTitle>협업 이력 ({influencer.collaborations.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          {influencer.collaborations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>협업 이력이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>캠페인</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>다음 일정</TableHead>
                  <TableHead>전체 일정</TableHead>
                  <TableHead>콘텐츠</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencer.collaborations.map((collab) => {
                  const collabSchedules = getCollabSchedules(collab.id)
                  const nextSchedule = getNextSchedule(collab.id)

                  return (
                    <TableRow key={collab.id}>
                      <TableCell>
                        <Link
                          href={`/campaigns/${collab.campaign.id}`}
                          className="font-medium hover:underline"
                        >
                          {collab.campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={COLLABORATION_STATUS_COLORS[collab.status]}>
                          {COLLABORATION_STATUS_LABELS[collab.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {nextSchedule ? (
                          <div className={`inline-flex items-center gap-1 text-xs p-1 rounded ${SCHEDULE_TYPE_COLORS[nextSchedule.type]}`}>
                            {getTypeIcon(nextSchedule.type)}
                            <span>{SCHEDULE_TYPE_LABELS[nextSchedule.type]}</span>
                            <span className="text-gray-600 ml-1">
                              {formatDate(nextSchedule.scheduledDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{collabSchedules.length}개</span>
                      </TableCell>
                      <TableCell>{collab.contents.length}개</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
