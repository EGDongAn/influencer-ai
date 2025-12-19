'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, X, Save } from 'lucide-react'
import {
  type InfluencerFormData,
  type InfluencerTier,
  type Platform,
  TIER_LABELS,
  PLATFORM_LABELS,
} from '@/lib/types'

const CATEGORIES = ['뷰티', '건강', '라이프스타일', '패션', '푸드', '여행', '육아', '피트니스']

export default function NewInfluencerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<InfluencerFormData>({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    profileImageUrl: '',
    tier: 'SILVER',
    category: [],
    notes: '',
    channels: [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/influencers')
      } else {
        alert('인플루언서 등록에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }))
  }

  const addChannel = () => {
    setFormData((prev) => ({
      ...prev,
      channels: [
        ...prev.channels,
        { platform: 'YOUTUBE', handle: '', url: '', followerCount: undefined },
      ],
    }))
  }

  const removeChannel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.filter((_, i) => i !== index),
    }))
  }

  const updateChannel = (
    index: number,
    field: keyof InfluencerFormData['channels'][0],
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.map((channel, i) =>
        i === index ? { ...channel, [field]: value } : channel
      ),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/influencers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">인플루언서 등록</h1>
          <p className="text-gray-600 mt-1">새로운 인플루언서를 등록하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="실명"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">활동명</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nickname: e.target.value }))
                  }
                  placeholder="채널명 또는 닉네임"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">티어 *</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: InfluencerTier) =>
                  setFormData((prev) => ({ ...prev, tier: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIER_LABELS) as InfluencerTier[]).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {TIER_LABELS[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>카테고리</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={
                      formData.category.includes(category) ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 채널 정보 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>채널 정보</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addChannel}>
              <Plus className="h-4 w-4 mr-1" />
              채널 추가
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.channels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 채널이 없습니다. 채널을 추가해주세요.
              </div>
            ) : (
              formData.channels.map((channel, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-4 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeChannel(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>플랫폼 *</Label>
                      <Select
                        value={channel.platform}
                        onValueChange={(value: Platform) =>
                          updateChannel(index, 'platform', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PLATFORM_LABELS) as Platform[]).map(
                            (platform) => (
                              <SelectItem key={platform} value={platform}>
                                {PLATFORM_LABELS[platform]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>채널명/핸들 *</Label>
                      <Input
                        value={channel.handle}
                        onChange={(e) =>
                          updateChannel(index, 'handle', e.target.value)
                        }
                        placeholder="@username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>팔로워 수</Label>
                      <Input
                        type="number"
                        value={channel.followerCount || ''}
                        onChange={(e) =>
                          updateChannel(
                            index,
                            'followerCount',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="10000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>채널 URL</Label>
                    <Input
                      value={channel.url}
                      onChange={(e) => updateChannel(index, 'url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardHeader>
            <CardTitle>메모</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="특이사항이나 메모를 입력하세요..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-4">
          <Link href="/influencers">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}
