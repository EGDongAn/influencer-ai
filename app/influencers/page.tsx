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
import { Plus, Search, Users, Eye, Sparkles } from 'lucide-react'
import {
  type InfluencerListItem,
  TIER_LABELS,
  TIER_COLORS,
  PLATFORM_LABELS,
} from '@/lib/types'

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<InfluencerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [useAiSearch, setUseAiSearch] = useState(false)

  useEffect(() => {
    fetchInfluencers()
  }, [tierFilter])

  // 검색어 또는 AI 검색 토글 변경 시 debounce 적용
  useEffect(() => {
    if (!search && !useAiSearch) return

    const timer = setTimeout(() => {
      fetchInfluencers()
    }, 500)

    return () => clearTimeout(timer)
  }, [search, useAiSearch])

  const fetchInfluencers = async () => {
    try {
      setLoading(true)

      // AI 검색 사용 시
      if (useAiSearch && search) {
        const response = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'influencer',
            query: search,
            limit: 20,
          }),
        })
        const data = await response.json()
        let results = data.results || []

        // 티어 필터 적용
        if (tierFilter && tierFilter !== 'all') {
          results = results.filter((inf: InfluencerListItem) => inf.tier === tierFilter)
        }

        setInfluencers(results)
      } else {
        // 일반 검색
        const params = new URLSearchParams()
        if (tierFilter && tierFilter !== 'all') {
          params.set('tier', tierFilter)
        }
        if (search) {
          params.set('search', search)
        }

        const response = await fetch(`/api/influencers?${params}`)
        const data = await response.json()
        setInfluencers(data)
      }
    } catch (error) {
      console.error('Failed to fetch influencers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInfluencers()
  }

  const formatFollowers = (count: number | null) => {
    if (!count) return '-'
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
    return count.toString()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">인플루언서 관리</h1>
          <p className="text-gray-600 mt-1">협업 인플루언서를 관리하세요</p>
        </div>
        <Link href="/influencers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            인플루언서 등록
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{influencers.length}</div>
          </CardContent>
        </Card>
        {(['VIP', 'GOLD', 'SILVER', 'BRONZE'] as const).map((tier) => (
          <Card key={tier}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{TIER_LABELS[tier]}</CardTitle>
              <Badge className={TIER_COLORS[tier]}>{tier}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {influencers.filter((i) => i.tier === tier).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={
                    useAiSearch
                      ? 'AI 검색으로 자연어 질문을 입력하세요...'
                      : '이름 또는 활동명으로 검색...'
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant={useAiSearch ? 'default' : 'outline'}
                size="icon"
                onClick={() => setUseAiSearch(!useAiSearch)}
                className={useAiSearch ? 'bg-purple-600 hover:bg-purple-700' : ''}
                title={useAiSearch ? 'AI 검색 활성화됨' : 'AI 검색 비활성화됨'}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="티어 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 티어</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="SILVER">Silver</SelectItem>
                <SelectItem value="BRONZE">Bronze</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              검색
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 인플루언서 목록 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : influencers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 인플루언서가 없습니다.</p>
              <Link href="/influencers/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  첫 인플루언서 등록하기
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>티어</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead>협업 수</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{influencer.name}</div>
                        {influencer.nickname && (
                          <div className="text-sm text-gray-500">
                            @{influencer.nickname}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={TIER_COLORS[influencer.tier]}>
                        {TIER_LABELS[influencer.tier]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {influencer.category.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="outline">
                            {cat}
                          </Badge>
                        ))}
                        {influencer.category.length > 2 && (
                          <Badge variant="outline">
                            +{influencer.category.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {influencer.channels.slice(0, 2).map((channel) => (
                          <div key={channel.id} className="text-sm">
                            <span className="text-gray-500">
                              {PLATFORM_LABELS[channel.platform]}
                            </span>
                            <span className="ml-2">
                              {formatFollowers(channel.followerCount)}
                            </span>
                          </div>
                        ))}
                        {influencer.channels.length > 2 && (
                          <div className="text-sm text-gray-400">
                            +{influencer.channels.length - 2}개 더
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {influencer._count.collaborations}건
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/influencers/${influencer.id}`}>
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
