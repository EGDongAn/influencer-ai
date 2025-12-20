'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Megaphone, Eye, Users } from 'lucide-react'
import {
  type CampaignWithCollaborations,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_TYPE_LABELS,
  TIER_COLORS,
} from '@/lib/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithCollaborations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchCampaigns()
  }, [statusFilter])

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/campaigns?${params}`)
      const data = await response.json()
      // API가 에러를 반환하거나 배열이 아닌 경우 빈 배열로 처리
      setCampaigns(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCampaigns()
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">캠페인 관리</h1>
          <p className="text-gray-600 mt-1">마케팅 캠페인을 관리하세요</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 캠페인
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 캠페인</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <Badge className={CAMPAIGN_STATUS_COLORS.IN_PROGRESS}>진행</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">기획 중</CardTitle>
            <Badge className={CAMPAIGN_STATUS_COLORS.PLANNING}>기획</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'PLANNING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <Badge className={CAMPAIGN_STATUS_COLORS.COMPLETED}>완료</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="캠페인명 또는 병원명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="PLANNING">기획 중</SelectItem>
                <SelectItem value="IN_PROGRESS">진행 중</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="CANCELLED">취소됨</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              검색
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 캠페인 목록 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 캠페인이 없습니다.</p>
              <Link href="/campaigns/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  첫 캠페인 만들기
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>캠페인명</TableHead>
                  <TableHead>병원</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>예산</TableHead>
                  <TableHead>인플루언서</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="font-medium">{campaign.name}</div>
                    </TableCell>
                    <TableCell>{campaign.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CAMPAIGN_TYPE_LABELS[campaign.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(campaign.startDate)}
                        {campaign.endDate && (
                          <>
                            <br />~ {formatDate(campaign.endDate)}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatBudget(campaign.budget)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{campaign._count.collaborations}명</span>
                        {campaign.collaborations.slice(0, 3).map((collab) => (
                          <Badge
                            key={collab.influencer.id}
                            className={TIER_COLORS[collab.influencer.tier]}
                            variant="outline"
                          >
                            {collab.influencer.nickname || collab.influencer.name}
                          </Badge>
                        ))}
                        {campaign.collaborations.length > 3 && (
                          <Badge variant="outline">
                            +{campaign.collaborations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          상세
                        </Button>
                      </Link>
                    </TableCell>
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
