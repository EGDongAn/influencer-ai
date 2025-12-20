'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Check, Loader2, Users } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TIER_LABELS, TIER_COLORS, type InfluencerTier } from '@/lib/types'

interface InfluencerRecommendation {
  id: string
  name: string
  nickname?: string | null
  tier: InfluencerTier
  profileImageUrl?: string | null
  category: string[]
  similarity?: number
  channels: {
    id: string
    platform: string
    handle: string
    followerCount?: number | null
  }[]
  _count: {
    collaborations: number
  }
}

interface InfluencerRecommenderProps {
  treatmentIds: string[]
  onSelect: (influencerId: string) => void
  selectedInfluencerIds?: string[]
}

export function InfluencerRecommender({
  treatmentIds,
  onSelect,
  selectedInfluencerIds = [],
}: InfluencerRecommenderProps) {
  const [recommendations, setRecommendations] = useState<InfluencerRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (treatmentIds.length === 0) {
      setRecommendations([])
      return
    }

    fetchRecommendations()
  }, [treatmentIds])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      // treatmentIds로 treatment 정보 조회
      const treatmentNames = await Promise.all(
        treatmentIds.map(async (id) => {
          const res = await fetch(`/api/treatments/${id}`)
          if (!res.ok) return null
          const treatment = await res.json()
          return treatment.nameKo || treatment.name
        })
      )

      const validNames = treatmentNames.filter((name): name is string => name !== null)

      if (validNames.length === 0) {
        setRecommendations([])
        return
      }

      // AI 검색 API 호출
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'influencer',
          query: validNames.join(', '),
          limit: 10,
        }),
      })

      if (!response.ok) {
        throw new Error('추천 인플루언서를 가져오는데 실패했습니다.')
      }

      const data = await response.json()
      setRecommendations(data.results || [])
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatFollowerCount = (count?: number | null) => {
    if (!count) return ''
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatSimilarity = (similarity?: number) => {
    if (!similarity) return null
    return `${(similarity * 100).toFixed(0)}%`
  }

  if (treatmentIds.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm text-gray-500">
          시술을 선택하면 AI가 적합한 인플루언서를 추천합니다
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI 추천 인플루언서
        </Label>
        <div className="border rounded-lg p-6 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-500">AI가 적합한 인플루언서를 찾고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI 추천 인플루언서
        </Label>
        <div className="border rounded-lg p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        AI 추천 인플루언서
        {recommendations.length > 0 && (
          <span className="text-xs font-normal text-gray-500">
            ({recommendations.length}명)
          </span>
        )}
      </Label>

      {recommendations.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">추천할 인플루언서가 없습니다</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
          {recommendations.map((influencer) => {
            const isSelected = selectedInfluencerIds.includes(influencer.id)
            const mainChannel = influencer.channels[0]
            const similarity = formatSimilarity(influencer.similarity)

            return (
              <div
                key={influencer.id}
                onClick={() => onSelect(influencer.id)}
                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-purple-50' : ''
                }`}
              >
                {/* 체크박스 */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>

                {/* 프로필 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{influencer.name}</span>
                    {influencer.nickname && (
                      <span className="text-sm text-gray-500 truncate">
                        @{influencer.nickname}
                      </span>
                    )}
                    <Badge className={`${TIER_COLORS[influencer.tier]} text-xs`}>
                      {TIER_LABELS[influencer.tier]}
                    </Badge>
                    {similarity && (
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                        {similarity} 일치
                      </Badge>
                    )}
                  </div>
                  {mainChannel && (
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{mainChannel.platform}</span>
                      <span>{mainChannel.handle}</span>
                      {mainChannel.followerCount && (
                        <span className="font-medium">
                          {formatFollowerCount(mainChannel.followerCount)} followers
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 협업 횟수 */}
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {influencer._count.collaborations}회 협업
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
