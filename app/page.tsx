'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Megaphone, Calendar, TrendingUp, Plus, Camera, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  type DashboardStats,
  TIER_LABELS,
  TIER_COLORS,
  COLLABORATION_STATUS_LABELS,
  COLLABORATION_STATUS_COLORS,
} from '@/lib/types'

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`
    return num.toString()
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const getUpcomingEventType = (collab: DashboardStats['upcomingSchedules'][0]) => {
    const now = new Date()
    const shooting = collab.shootingDate ? new Date(collab.shootingDate) : null
    const progress = collab.progressDate ? new Date(collab.progressDate) : null
    const upload = collab.uploadDeadline ? new Date(collab.uploadDeadline) : null

    const events = [
      { type: 'shooting', date: shooting, label: '촬영', icon: Camera },
      { type: 'progress', date: progress, label: '경과사진', icon: Camera },
      { type: 'upload', date: upload, label: '업로드', icon: Upload },
    ].filter((e) => e.date && e.date >= now)

    events.sort((a, b) => (a.date!.getTime() - b.date!.getTime()))

    return events[0] || null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-600 mt-1">인플루언서 마케팅 관리 시스템</p>
        </div>
        <div className="flex gap-2">
          <Link href="/influencers">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              인플루언서 관리
            </Button>
          </Link>
          <Link href="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 캠페인
            </Button>
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 인플루언서</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.influencers.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading
                ? '로딩 중...'
                : `VIP ${stats?.influencers.VIP || 0} / Gold ${
                    stats?.influencers.GOLD || 0
                  } / Silver ${stats?.influencers.SILVER || 0}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중 캠페인</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.campaigns.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading
                ? '로딩 중...'
                : `이번 달 ${stats?.campaigns.completedThisMonth || 0}건 완료`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 주 일정</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.schedule.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading
                ? '로딩 중...'
                : `촬영 ${stats?.schedule.shooting || 0} / 업로드 ${
                    stats?.schedule.upload || 0
                  }`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">콘텐츠 성과</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats?.content.total || 0}개
            </div>
            <p className="text-xs text-muted-foreground">
              {loading
                ? '로딩 중...'
                : `총 조회수 ${formatNumber(stats?.content.views || 0)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 시작 가이드 - 데이터가 없을 때만 표시 */}
      {!loading && stats?.influencers.total === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>시작하기</CardTitle>
            <CardDescription>인플루언서 마케팅 관리 시스템 사용법</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/influencers/new" className="block">
                <div className="p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <h3 className="font-medium">인플루언서 등록</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    협업할 인플루언서 정보와 채널을 등록하세요.
                  </p>
                </div>
              </Link>
              <Link href="/campaigns/new" className="block">
                <div className="p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <h3 className="font-medium">캠페인 생성</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    마케팅 캠페인을 생성하고 인플루언서를 배정하세요.
                  </p>
                </div>
              </Link>
              <Link href="/board/calendar" className="block">
                <div className="p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <h3 className="font-medium">일정 관리</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    촬영, 경과사진, 업로드 일정을 관리하세요.
                  </p>
                </div>
              </Link>
              <Link href="/board/kanban" className="block">
                <div className="p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                    <h3 className="font-medium">성과 추적</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    업로드된 콘텐츠의 성과를 추적하세요.
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 진행 상태 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">진행 중인 협업</CardTitle>
            <Link href="/board/kanban">
              <Button variant="ghost" size="sm">
                전체 보기 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : !stats?.activeCollaborations?.length ? (
              <div className="text-center py-8 text-gray-500">
                진행 중인 협업이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.activeCollaborations.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/influencers/${collab.influencer.id}`}
                            className="font-medium hover:underline"
                          >
                            {collab.influencer.name}
                          </Link>
                          <Badge
                            className={TIER_COLORS[collab.influencer.tier]}
                          >
                            {TIER_LABELS[collab.influencer.tier]}
                          </Badge>
                        </div>
                        <Link
                          href={`/campaigns/${collab.campaign.id}`}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          {collab.campaign.name}
                        </Link>
                      </div>
                    </div>
                    <Badge
                      className={COLLABORATION_STATUS_COLORS[collab.status]}
                    >
                      {COLLABORATION_STATUS_LABELS[collab.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">다가오는 일정</CardTitle>
            <Link href="/board/calendar">
              <Button variant="ghost" size="sm">
                전체 보기 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : !stats?.upcomingSchedules?.length ? (
              <div className="text-center py-8 text-gray-500">
                예정된 일정이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingSchedules.map((collab) => {
                  const event = getUpcomingEventType(collab)
                  if (!event) return null

                  return (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <event.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{event.label}</div>
                          <Link
                            href={`/influencers/${collab.influencer.id}`}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            {collab.influencer.name}
                          </Link>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatDate(event.date)}
                        </div>
                        <Link
                          href={`/campaigns/${collab.campaign.id}`}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          {collab.campaign.name}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
