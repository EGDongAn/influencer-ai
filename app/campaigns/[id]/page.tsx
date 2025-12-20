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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  Users,
  Building,
  Camera,
  Upload,
  Image,
  FileCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import {
  type CampaignDetail,
  type InfluencerListItem,
  type CollaborationStatus,
  type FeeType,
  type ScheduleWithRelations,
  type ScheduleType,
  type ScheduleStatus,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_TYPE_LABELS,
  TIER_LABELS,
  TIER_COLORS,
  COLLABORATION_STATUS_LABELS,
  COLLABORATION_STATUS_COLORS,
  FEE_TYPE_LABELS,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE_COLORS,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
} from '@/lib/types'
import { TreatmentSelector } from '@/components/treatments/TreatmentSelector'
import { RoundSettings } from '@/components/treatments/RoundSettings'
import {
  getScheduleColor,
  formatDday,
  formatRound,
} from '@/lib/schedule-colors'

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addInfluencerDialogOpen, setAddInfluencerDialogOpen] = useState(false)
  const [addScheduleDialogOpen, setAddScheduleDialogOpen] = useState(false)
  const [selectedCollaborationId, setSelectedCollaborationId] = useState<string | null>(null)
  const [expandedCollabs, setExpandedCollabs] = useState<Set<string>>(new Set())
  const [availableInfluencers, setAvailableInfluencers] = useState<InfluencerListItem[]>([])

  // 새 협업 폼 데이터
  const [newCollaboration, setNewCollaboration] = useState({
    influencerId: '',
    fee: '',
    feeType: 'FIXED' as FeeType,
    status: 'CONTACTED' as CollaborationStatus,
    shootingRounds: 1,
    progressRounds: 2,
    treatmentIds: [] as string[],
    createSchedules: true,
  })

  // 새 일정 폼 데이터
  const [newSchedule, setNewSchedule] = useState({
    type: 'SHOOTING' as ScheduleType,
    title: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [campaignRes, schedulesRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`),
        fetch(`/api/schedules?campaignId=${id}`),
      ])

      if (campaignRes.ok) {
        const campaignData = await campaignRes.json()
        setCampaign(campaignData)
      } else {
        router.push('/campaigns')
        return
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        setSchedules(Array.isArray(schedulesData) ? schedulesData : [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      router.push('/campaigns')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableInfluencers = async () => {
    try {
      const response = await fetch('/api/influencers')
      if (response.ok) {
        const data = await response.json()
        const existingIds = campaign?.collaborations.map((c) => c.influencer.id) || []
        const available = data.filter(
          (i: InfluencerListItem) => !existingIds.includes(i.id)
        )
        setAvailableInfluencers(available)
      }
    } catch (error) {
      console.error('Failed to fetch influencers:', error)
    }
  }

  const getCollabSchedules = (collaborationId: string): ScheduleWithRelations[] => {
    return schedules
      .filter((s) => s.collaborationId === collaborationId)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/campaigns')
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
    }
  }

  const handleAddInfluencer = async () => {
    if (!newCollaboration.influencerId) {
      alert('인플루언서를 선택해주세요.')
      return
    }

    try {
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: id,
          influencerId: newCollaboration.influencerId,
          fee: newCollaboration.fee ? parseFloat(newCollaboration.fee) : null,
          feeType: newCollaboration.feeType,
          status: newCollaboration.status,
          shootingRounds: newCollaboration.shootingRounds,
          progressRounds: newCollaboration.progressRounds,
          treatmentIds: newCollaboration.treatmentIds,
          createSchedules: newCollaboration.createSchedules,
        }),
      })

      if (response.ok) {
        setAddInfluencerDialogOpen(false)
        setNewCollaboration({
          influencerId: '',
          fee: '',
          feeType: 'FIXED',
          status: 'CONTACTED',
          shootingRounds: 1,
          progressRounds: 2,
          treatmentIds: [],
          createSchedules: true,
        })
        fetchData()
      } else {
        alert('인플루언서 추가에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
    }
  }

  const handleAddSchedule = async () => {
    if (!selectedCollaborationId || !newSchedule.scheduledDate) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: selectedCollaborationId,
          type: newSchedule.type,
          title: newSchedule.title || null,
          scheduledDate: new Date(newSchedule.scheduledDate),
          scheduledTime: newSchedule.scheduledTime || null,
          notes: newSchedule.notes || null,
        }),
      })

      if (response.ok) {
        setAddScheduleDialogOpen(false)
        setNewSchedule({
          type: 'SHOOTING',
          title: '',
          scheduledDate: '',
          scheduledTime: '',
          notes: '',
        })
        setSelectedCollaborationId(null)
        fetchData()
      } else {
        alert('일정 추가에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
    }
  }

  const handleUpdateScheduleStatus = async (scheduleId: string, status: ScheduleStatus) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update schedule status:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const handleUpdateCollaborationStatus = async (
    collaborationId: string,
    status: CollaborationStatus
  ) => {
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const toggleCollabExpand = (collabId: string) => {
    setExpandedCollabs((prev) => {
      const next = new Set(prev)
      if (next.has(collabId)) {
        next.delete(collabId)
      } else {
        next.add(collabId)
      }
      return next
    })
  }

  const openAddScheduleDialog = (collaborationId: string) => {
    setSelectedCollaborationId(collaborationId)
    setAddScheduleDialogOpen(true)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR')
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

  const formatBudget = (budget: unknown) => {
    if (!budget) return '-'
    const num = typeof budget === 'string' ? parseFloat(budget) : Number(budget)
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(num)
  }

  const getTypeIcon = (type: ScheduleType) => {
    switch (type) {
      case 'SHOOTING':
        return <Camera className="h-4 w-4" />
      case 'PROGRESS':
        return <Image className="h-4 w-4" />
      case 'UPLOAD':
        return <Upload className="h-4 w-4" />
      case 'MEETING':
        return <Users className="h-4 w-4" />
      case 'REVIEW':
        return <FileCheck className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!campaign) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{campaign.clientName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/campaigns/${id}/edit`}>
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
                <DialogTitle>캠페인 삭제</DialogTitle>
                <DialogDescription>
                  정말로 &quot;{campaign.name}&quot; 캠페인을 삭제하시겠습니까? 관련된
                  모든 협업 정보도 함께 삭제됩니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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

      {/* 캠페인 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">유형</p>
                <p className="font-medium">{CAMPAIGN_TYPE_LABELS[campaign.type]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">기간</p>
                <p className="font-medium">
                  {formatDate(campaign.startDate)}
                  {campaign.endDate && ` ~ ${formatDate(campaign.endDate)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">예산</p>
                <p className="font-medium">{formatBudget(campaign.budget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">인플루언서</p>
                <p className="font-medium">{campaign.collaborations.length}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 설명 */}
      {campaign.description && (
        <Card>
          <CardHeader>
            <CardTitle>설명</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{campaign.description}</p>
          </CardContent>
        </Card>
      )}

      {/* 인플루언서 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>협업 인플루언서</CardTitle>
          <Dialog
            open={addInfluencerDialogOpen}
            onOpenChange={(open) => {
              setAddInfluencerDialogOpen(open)
              if (open) fetchAvailableInfluencers()
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                인플루언서 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>인플루언서 추가</DialogTitle>
                <DialogDescription>
                  이 캠페인에 참여할 인플루언서와 시술, 일정을 설정하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* 인플루언서 선택 */}
                <div className="space-y-2">
                  <Label>인플루언서 *</Label>
                  <Select
                    value={newCollaboration.influencerId}
                    onValueChange={(value) =>
                      setNewCollaboration((prev) => ({ ...prev, influencerId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="인플루언서 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInfluencers.map((influencer) => (
                        <SelectItem key={influencer.id} value={influencer.id}>
                          {influencer.name}
                          {influencer.nickname && ` (@${influencer.nickname})`} -{' '}
                          {TIER_LABELS[influencer.tier]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 시술 선택 */}
                <div className="space-y-2">
                  <Label>시술 선택</Label>
                  <TreatmentSelector
                    selectedIds={newCollaboration.treatmentIds}
                    onChange={(ids) =>
                      setNewCollaboration((prev) => ({ ...prev, treatmentIds: ids }))
                    }
                  />
                </div>

                {/* 회차 설정 */}
                <div className="space-y-2">
                  <Label>회차 설정</Label>
                  <RoundSettings
                    shootingRounds={newCollaboration.shootingRounds}
                    progressRounds={newCollaboration.progressRounds}
                    onShootingChange={(value) =>
                      setNewCollaboration((prev) => ({ ...prev, shootingRounds: value }))
                    }
                    onProgressChange={(value) =>
                      setNewCollaboration((prev) => ({ ...prev, progressRounds: value }))
                    }
                  />
                </div>

                {/* 자동 일정 생성 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createSchedules"
                    checked={newCollaboration.createSchedules}
                    onChange={(e) =>
                      setNewCollaboration((prev) => ({
                        ...prev,
                        createSchedules: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="createSchedules" className="text-sm font-normal">
                    일정 템플릿 자동 생성 (날짜는 추후 수정 가능)
                  </Label>
                </div>

                {/* 협찬비 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>협찬비</Label>
                    <Input
                      type="number"
                      value={newCollaboration.fee}
                      onChange={(e) =>
                        setNewCollaboration((prev) => ({ ...prev, fee: e.target.value }))
                      }
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>정산 유형</Label>
                    <Select
                      value={newCollaboration.feeType}
                      onValueChange={(value: FeeType) =>
                        setNewCollaboration((prev) => ({ ...prev, feeType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FEE_TYPE_LABELS) as FeeType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            {FEE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddInfluencerDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleAddInfluencer}>추가</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campaign.collaborations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>아직 인플루언서가 없습니다.</p>
              <p className="text-sm">위의 버튼을 눌러 인플루언서를 추가하세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaign.collaborations.map((collab) => {
                const collabSchedules = getCollabSchedules(collab.id)
                const isExpanded = expandedCollabs.has(collab.id)

                return (
                  <div key={collab.id} className="border rounded-lg overflow-hidden">
                    {/* 협업 헤더 */}
                    <div
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleCollabExpand(collab.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                            <Link
                              href={`/influencers/${collab.influencer.id}`}
                              className="font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {collab.influencer.name}
                              {collab.influencer.nickname && (
                                <span className="text-gray-500 ml-1">
                                  @{collab.influencer.nickname}
                                </span>
                              )}
                            </Link>
                          </div>
                          <Badge className={TIER_COLORS[collab.influencer.tier]}>
                            {TIER_LABELS[collab.influencer.tier]}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatBudget(collab.fee)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <Badge className="text-xs">
                            {collabSchedules.length}개 일정
                          </Badge>
                          <Select
                            value={collab.status}
                            onValueChange={(value: CollaborationStatus) =>
                              handleUpdateCollaborationStatus(collab.id, value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <Badge className={COLLABORATION_STATUS_COLORS[collab.status]}>
                                {COLLABORATION_STATUS_LABELS[collab.status]}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(COLLABORATION_STATUS_LABELS) as CollaborationStatus[]).map(
                                (status) => (
                                  <SelectItem key={status} value={status}>
                                    {COLLABORATION_STATUS_LABELS[status]}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* 일정 목록 (확장시) */}
                    {isExpanded && (
                      <div className="p-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">일정 관리</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddScheduleDialog(collab.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            일정 추가
                          </Button>
                        </div>

                        {collabSchedules.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-sm border rounded-lg border-dashed">
                            등록된 일정이 없습니다
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[150px]">유형</TableHead>
                                <TableHead>제목</TableHead>
                                <TableHead>일시</TableHead>
                                <TableHead className="w-[80px]">D-day</TableHead>
                                <TableHead className="w-[140px]">상태</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {collabSchedules.map((schedule) => {
                                const colorConfig = getScheduleColor(schedule)
                                const ddayText = formatDday(schedule)
                                const roundText = formatRound(
                                  schedule.roundNumber,
                                  schedule.totalRounds
                                )
                                return (
                                  <TableRow
                                    key={schedule.id}
                                    className={colorConfig.bg}
                                  >
                                    <TableCell>
                                      <Badge className={`${colorConfig.badge} text-white`}>
                                        {getTypeIcon(schedule.type)}
                                        <span className="ml-1">
                                          {SCHEDULE_TYPE_LABELS[schedule.type]}
                                          {roundText && ` (${roundText})`}
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {schedule.title || '-'}
                                      {schedule.notes && (
                                        <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">
                                          {schedule.notes}
                                        </p>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-sm">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        {formatDateTime(schedule.scheduledDate, schedule.scheduledTime)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className={`font-bold ${colorConfig.text}`}>
                                        {ddayText}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={schedule.status}
                                        onValueChange={(value: ScheduleStatus) =>
                                          handleUpdateScheduleStatus(schedule.id, value)
                                        }
                                      >
                                        <SelectTrigger className="h-7 text-xs">
                                          <Badge className={SCHEDULE_STATUS_COLORS[schedule.status]}>
                                            {SCHEDULE_STATUS_LABELS[schedule.status]}
                                          </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(Object.keys(SCHEDULE_STATUS_LABELS) as ScheduleStatus[]).map(
                                            (status) => (
                                              <SelectItem key={status} value={status}>
                                                {SCHEDULE_STATUS_LABELS[status]}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일정 추가 다이얼로그 */}
      <Dialog open={addScheduleDialogOpen} onOpenChange={setAddScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일정 추가</DialogTitle>
            <DialogDescription>
              새로운 일정을 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>일정 유형 *</Label>
                <Select
                  value={newSchedule.type}
                  onValueChange={(value: ScheduleType) =>
                    setNewSchedule((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SCHEDULE_TYPE_LABELS) as ScheduleType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {SCHEDULE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="예: 1차 촬영"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>날짜 *</Label>
                <Input
                  type="date"
                  value={newSchedule.scheduledDate}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>시간</Label>
                <Input
                  type="time"
                  value={newSchedule.scheduledTime}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({ ...prev, scheduledTime: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={newSchedule.notes}
                onChange={(e) =>
                  setNewSchedule((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="추가 정보를 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddScheduleDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddSchedule}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
