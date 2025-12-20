'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bot,
  MessageSquare,
  FileBarChart,
  Wand2,
  Search,
  ArrowRight,
  Loader2,
} from 'lucide-react'

interface DashboardStats {
  influencers: {
    total: number
    VIP: number
    GOLD: number
    SILVER: number
    BRONZE: number
  }
  campaigns: {
    active: number
    completedThisMonth: number
  }
}

export default function AIPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const features = [
    {
      icon: MessageSquare,
      title: 'AI 채팅',
      description: '자연어로 데이터 검색, 조회, 수정',
      href: '/ai/chat',
      color: 'purple',
    },
    {
      icon: Search,
      title: '시술별 검색',
      description: '시술 경험이 있는 인플루언서 검색',
      href: '/ai/chat?prompt=시술별 인플루언서 검색',
      color: 'blue',
    },
    {
      icon: Wand2,
      title: '후기 생성',
      description: '블로그/SNS 후기 자동 작성',
      href: '/ai/chat?prompt=후기 생성',
      color: 'pink',
    },
    {
      icon: FileBarChart,
      title: '리포트 생성',
      description: '캠페인/인플루언서 분석 리포트',
      href: '/ai/reports',
      color: 'green',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-purple-600" />
            AI 어시스턴트
          </h1>
          <p className="text-gray-500 mt-1">
            AI를 활용한 인플루언서 마케팅 관리
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">활동 인플루언서</p>
            <p className="text-2xl font-bold">{stats.influencers.total}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">VIP 인플루언서</p>
            <p className="text-2xl font-bold text-purple-600">{stats.influencers.VIP}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">진행 중 캠페인</p>
            <p className="text-2xl font-bold text-green-600">{stats.campaigns.active}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-gray-500">이번 달 완료</p>
            <p className="text-2xl font-bold text-blue-600">{stats.campaigns.completedThisMonth}</p>
          </div>
        </div>
      ) : null}

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group rounded-xl border bg-white p-6 hover:shadow-lg hover:border-purple-200 transition-all"
          >
            <div className="flex items-start justify-between">
              <div
                className={`rounded-lg p-3 ${
                  feature.color === 'purple'
                    ? 'bg-purple-100'
                    : feature.color === 'blue'
                      ? 'bg-blue-100'
                      : feature.color === 'pink'
                        ? 'bg-pink-100'
                        : 'bg-green-100'
                }`}
              >
                <feature.icon
                  className={`h-6 w-6 ${
                    feature.color === 'purple'
                      ? 'text-purple-600'
                      : feature.color === 'blue'
                        ? 'text-blue-600'
                        : feature.color === 'pink'
                          ? 'text-pink-600'
                          : 'text-green-600'
                  }`}
                />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{feature.title}</h3>
            <p className="mt-1 text-gray-500">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-gradient-to-r from-purple-50 to-blue-50 p-6">
        <h2 className="font-semibold text-lg mb-4">빠른 질문</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'VIP 인플루언서 목록',
            '진행 중인 캠페인 현황',
            '보톡스 시술 경험 인플루언서',
            '이번 달 일정',
            '대시보드 통계',
          ].map((question) => (
            <Link
              key={question}
              href={`/ai/chat?prompt=${encodeURIComponent(question)}`}
              className="rounded-full border bg-white px-4 py-2 text-sm hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              {question}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
