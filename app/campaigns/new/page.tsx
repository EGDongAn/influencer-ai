'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import {
  type CampaignFormData,
  type CampaignType,
  type CampaignStatus,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from '@/lib/types'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    clientName: '',
    clientContact: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    type: 'COLLABORATION',
    budget: undefined,
    status: 'PLANNING',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          budget: formData.budget || null,
        }),
      })

      if (response.ok) {
        const campaign = await response.json()
        router.push(`/campaigns/${campaign.id}`)
      } else {
        alert('캠페인 생성에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">새 캠페인</h1>
          <p className="text-gray-600 mt-1">새로운 마케팅 캠페인을 생성하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>캠페인 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">캠페인명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="예: 2024 겨울 피부관리 캠페인"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="캠페인에 대한 설명을 입력하세요..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">캠페인 유형 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CampaignType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {CAMPAIGN_TYPE_LABELS[type]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태 *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: CampaignStatus) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {CAMPAIGN_STATUS_LABELS[status]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 클라이언트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>클라이언트 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">병원/클라이언트명 *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                  }
                  placeholder="예: OO피부과"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientContact">담당자 연락처</Label>
                <Input
                  id="clientContact"
                  value={formData.clientContact}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientContact: e.target.value,
                    }))
                  }
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 일정 및 예산 */}
        <Card>
          <CardHeader>
            <CardTitle>일정 및 예산</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">예산 (원)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budget: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  placeholder="5000000"
                />
              </div>
            </div>
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
              placeholder="캠페인 관련 메모를 입력하세요..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-4">
          <Link href="/campaigns">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? '생성 중...' : '캠페인 생성'}
          </Button>
        </div>
      </form>
    </div>
  )
}
