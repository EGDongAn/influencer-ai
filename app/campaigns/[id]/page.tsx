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
} from 'lucide-react'
import {
  type CampaignDetail,
  type InfluencerListItem,
  type CollaborationStatus,
  type FeeType,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_TYPE_LABELS,
  TIER_LABELS,
  TIER_COLORS,
  COLLABORATION_STATUS_LABELS,
  COLLABORATION_STATUS_COLORS,
  FEE_TYPE_LABELS,
} from '@/lib/types'

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addInfluencerDialogOpen, setAddInfluencerDialogOpen] = useState(false)
  const [availableInfluencers, setAvailableInfluencers] = useState<
    InfluencerListItem[]
  >([])

  // 새 협업 폼 데이터
  const [newCollaboration, setNewCollaboration] = useState({
    influencerId: '',
    fee: '',
    feeType: 'FIXED' as FeeType,
    shootingDate: '',
    progressDate: '',
    uploadDeadline: '',
    status: 'CONTACTED' as CollaborationStatus,
  })

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data)
      } else {
        router.push('/campaigns')
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
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
        // 이미 협업 중인 인플루언서 제외
        const existingIds =
          campaign?.collaborations.map((c) => c.influencer.id) || []
        const available = data.filter(
          (i: InfluencerListItem) => !existingIds.includes(i.id)
        )
        setAvailableInfluencers(available)
      }
    } catch (error) {
      console.error('Failed to fetch influencers:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      })
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
          shootingDate: newCollaboration.shootingDate
            ? new Date(newCollaboration.shootingDate)
            : null,
          progressDate: newCollaboration.progressDate
            ? new Date(newCollaboration.progressDate)
            : null,
          uploadDeadline: newCollaboration.uploadDeadline
            ? new Date(newCollaboration.uploadDeadline)
            : null,
          status: newCollaboration.status,
        }),
      })

      if (response.ok) {
        setAddInfluencerDialogOpen(false)
        setNewCollaboration({
          influencerId: '',
          fee: '',
          feeType: 'FIXED',
          shootingDate: '',
          progressDate: '',
          uploadDeadline: '',
          status: 'CONTACTED',
        })
        fetchCampaign()
      } else {
        alert('인플루언서 추가에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
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
        fetchCampaign()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR')
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
            <p className="text-gray-700 whitespace-pre-wrap">
              {campaign.description}
            </p>
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>인플루언서 추가</DialogTitle>
                <DialogDescription>
                  이 캠페인에 참여할 인플루언서를 추가하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>인플루언서 *</Label>
                  <Select
                    value={newCollaboration.influencerId}
                    onValueChange={(value) =>
                      setNewCollaboration((prev) => ({
                        ...prev,
                        influencerId: value,
                      }))
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>협찬비</Label>
                    <Input
                      type="number"
                      value={newCollaboration.fee}
                      onChange={(e) =>
                        setNewCollaboration((prev) => ({
                          ...prev,
                          fee: e.target.value,
                        }))
                      }
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>정산 유형</Label>
                    <Select
                      value={newCollaboration.feeType}
                      onValueChange={(value: FeeType) =>
                        setNewCollaboration((prev) => ({
                          ...prev,
                          feeType: value,
                        }))
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>촬영일</Label>
                    <Input
                      type="date"
                      value={newCollaboration.shootingDate}
                      onChange={(e) =>
                        setNewCollaboration((prev) => ({
                          ...prev,
                          shootingDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>경과사진일</Label>
                    <Input
                      type="date"
                      value={newCollaboration.progressDate}
                      onChange={(e) =>
                        setNewCollaboration((prev) => ({
                          ...prev,
                          progressDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>업로드 마감</Label>
                    <Input
                      type="date"
                      value={newCollaboration.uploadDeadline}
                      onChange={(e) =>
                        setNewCollaboration((prev) => ({
                          ...prev,
                          uploadDeadline: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddInfluencerDialogOpen(false)}
                >
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>인플루언서</TableHead>
                  <TableHead>티어</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>협찬비</TableHead>
                  <TableHead>촬영일</TableHead>
                  <TableHead>업로드 마감</TableHead>
                  <TableHead>콘텐츠</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.collaborations.map((collab) => (
                  <TableRow key={collab.id}>
                    <TableCell>
                      <Link
                        href={`/influencers/${collab.influencer.id}`}
                        className="font-medium hover:underline"
                      >
                        {collab.influencer.name}
                        {collab.influencer.nickname && (
                          <span className="text-gray-500 ml-1">
                            @{collab.influencer.nickname}
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={TIER_COLORS[collab.influencer.tier]}>
                        {TIER_LABELS[collab.influencer.tier]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={collab.status}
                        onValueChange={(value: CollaborationStatus) =>
                          handleUpdateCollaborationStatus(collab.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <Badge
                            className={COLLABORATION_STATUS_COLORS[collab.status]}
                          >
                            {COLLABORATION_STATUS_LABELS[collab.status]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(
                              COLLABORATION_STATUS_LABELS
                            ) as CollaborationStatus[]
                          ).map((status) => (
                            <SelectItem key={status} value={status}>
                              {COLLABORATION_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatBudget(collab.fee)}</TableCell>
                    <TableCell>{formatDate(collab.shootingDate)}</TableCell>
                    <TableCell>{formatDate(collab.uploadDeadline)}</TableCell>
                    <TableCell>{collab.contents.length}개</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
