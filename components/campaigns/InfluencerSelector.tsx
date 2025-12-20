'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, Search, X, User, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIER_LABELS, TIER_COLORS, type InfluencerTier } from '@/lib/types'

interface Influencer {
  id: string
  name: string
  nickname?: string | null
  tier: InfluencerTier
  profileImageUrl?: string | null
  category: string[]
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

interface InfluencerSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[], influencers: Influencer[]) => void
  excludeIds?: string[]
}

export function InfluencerSelector({
  selectedIds,
  onChange,
  excludeIds = [],
}: InfluencerSelectorProps) {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<InfluencerTier | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInfluencers()
  }, [])

  const fetchInfluencers = async () => {
    try {
      const response = await fetch('/api/influencers')
      const data = await response.json()
      setInfluencers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch influencers:', error)
    } finally {
      setLoading(false)
    }
  }

  // 필터링된 인플루언서 목록
  const filteredInfluencers = useMemo(() => {
    const excludeSet = new Set(excludeIds)
    return influencers
      .filter((i) => !excludeSet.has(i.id))
      .filter((i) => {
        if (tierFilter !== 'ALL' && i.tier !== tierFilter) return false

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          return (
            i.name.toLowerCase().includes(query) ||
            i.nickname?.toLowerCase().includes(query) ||
            i.channels.some((c) => c.handle.toLowerCase().includes(query))
          )
        }

        return true
      })
  }, [influencers, excludeIds, searchQuery, tierFilter])

  // 선택된 인플루언서 목록
  const selectedInfluencers = useMemo(() => {
    return influencers.filter((i) => selectedIds.includes(i.id))
  }, [selectedIds, influencers])

  const handleToggle = (influencer: Influencer) => {
    const isSelected = selectedIds.includes(influencer.id)
    let newIds: string[]
    let newInfluencers: Influencer[]

    if (isSelected) {
      newIds = selectedIds.filter((id) => id !== influencer.id)
      newInfluencers = selectedInfluencers.filter((i) => i.id !== influencer.id)
    } else {
      newIds = [...selectedIds, influencer.id]
      newInfluencers = [...selectedInfluencers, influencer]
    }

    onChange(newIds, newInfluencers)
  }

  const handleRemove = (influencerId: string) => {
    const newIds = selectedIds.filter((id) => id !== influencerId)
    const newInfluencers = selectedInfluencers.filter((i) => i.id !== influencerId)
    onChange(newIds, newInfluencers)
  }

  const formatFollowerCount = (count?: number | null) => {
    if (!count) return ''
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 선택된 인플루언서 */}
      {selectedInfluencers.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">
            선택된 인플루언서 ({selectedInfluencers.length}명)
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedInfluencers.map((influencer) => (
              <Badge
                key={influencer.id}
                variant="secondary"
                className="pl-3 pr-1 py-1.5 flex items-center gap-1"
              >
                <span className={`w-2 h-2 rounded-full ${
                  influencer.tier === 'VIP' ? 'bg-purple-500' :
                  influencer.tier === 'GOLD' ? 'bg-yellow-500' :
                  influencer.tier === 'SILVER' ? 'bg-gray-400' : 'bg-orange-500'
                }`} />
                {influencer.nickname || influencer.name}
                <button
                  onClick={() => handleRemove(influencer.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 닉네임, 채널명으로 검색..."
            className="pl-10"
          />
        </div>
        <Select
          value={tierFilter}
          onValueChange={(value) => setTierFilter(value as InfluencerTier | 'ALL')}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="티어" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 티어</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="GOLD">Gold</SelectItem>
            <SelectItem value="SILVER">Silver</SelectItem>
            <SelectItem value="BRONZE">Bronze</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 인플루언서 목록 */}
      <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
        {filteredInfluencers.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            {searchQuery ? '검색 결과가 없습니다.' : '인플루언서가 없습니다.'}
          </div>
        ) : (
          filteredInfluencers.map((influencer) => {
            const isSelected = selectedIds.includes(influencer.id)
            const mainChannel = influencer.channels[0]

            return (
              <div
                key={influencer.id}
                onClick={() => handleToggle(influencer)}
                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-purple-50' : ''
                }`}
              >
                {/* 체크박스 */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-600'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>

                {/* 프로필 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {influencer.name}
                    </span>
                    {influencer.nickname && (
                      <span className="text-sm text-gray-500 truncate">
                        @{influencer.nickname}
                      </span>
                    )}
                    <Badge className={`${TIER_COLORS[influencer.tier]} text-xs`}>
                      {TIER_LABELS[influencer.tier]}
                    </Badge>
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
          })
        )}
      </div>

      <div className="text-xs text-gray-400">
        총 {filteredInfluencers.length}명의 인플루언서
      </div>
    </div>
  )
}
