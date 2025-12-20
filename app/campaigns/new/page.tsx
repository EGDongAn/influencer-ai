'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Megaphone,
  Users,
  Syringe,
  Settings,
} from 'lucide-react'
import {
  type CampaignFormData,
  type CampaignType,
  type CampaignStatus,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  TIER_LABELS,
  TIER_COLORS,
  type InfluencerTier,
} from '@/lib/types'
import { InfluencerSelector } from '@/components/campaigns/InfluencerSelector'
import { TreatmentSelector } from '@/components/treatments/TreatmentSelector'
import { RoundSettings } from '@/components/treatments/RoundSettings'
import { InfluencerRecommender } from '@/components/ai/influencer-recommender'

interface SelectedInfluencer {
  id: string
  name: string
  nickname?: string | null
  tier: InfluencerTier
}

interface SelectedTreatment {
  id: string
  name: string
  nameKo?: string | null
  defaultShootingRounds: number
  defaultProgressRounds: number
}

const STEPS = [
  { id: 1, title: '기본 정보', icon: Megaphone },
  { id: 2, title: '시술 선택', icon: Syringe },
  { id: 3, title: '인플루언서', icon: Users },
  { id: 4, title: '회차 설정', icon: Settings },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // 기본 캠페인 정보
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

  // 인플루언서 선택
  const [selectedInfluencerIds, setSelectedInfluencerIds] = useState<string[]>([])
  const [selectedInfluencers, setSelectedInfluencers] = useState<SelectedInfluencer[]>([])

  // 시술 선택
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([])
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([])

  // 회차 설정
  const [shootingRounds, setShootingRounds] = useState(1)
  const [progressRounds, setProgressRounds] = useState(2)
  const [createSchedules, setCreateSchedules] = useState(true)

  const handleInfluencerChange = (ids: string[], influencers: SelectedInfluencer[]) => {
    setSelectedInfluencerIds(ids)
    setSelectedInfluencers(influencers)
  }

  const handleTreatmentChange = (ids: string[], treatments: SelectedTreatment[]) => {
    setSelectedTreatmentIds(ids)
    setSelectedTreatments(treatments)

    // 첫 번째 시술의 기본 회차 적용
    if (treatments.length > 0) {
      const firstTreatment = treatments[0]
      setShootingRounds(firstTreatment.defaultShootingRounds)
      setProgressRounds(firstTreatment.defaultProgressRounds)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.clientName.trim() && formData.startDate
      case 2:
        return true // 인플루언서는 선택 사항
      case 3:
        return true // 시술도 선택 사항
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // 1. 캠페인 생성
      const campaignResponse = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          budget: formData.budget || null,
        }),
      })

      if (!campaignResponse.ok) {
        throw new Error('캠페인 생성 실패')
      }

      const campaign = await campaignResponse.json()

      // 2. 선택한 인플루언서로 협업 생성
      if (selectedInfluencerIds.length > 0) {
        await Promise.all(
          selectedInfluencerIds.map((influencerId) =>
            fetch('/api/collaborations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId: campaign.id,
                influencerId,
                feeType: 'FIXED',
                status: 'CONTACTED',
                shootingRounds,
                progressRounds,
                treatmentIds: selectedTreatmentIds,
                createSchedules,
              }),
            })
          )
        )
      }

      router.push(`/campaigns/${campaign.id}`)
    } catch {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 헤더 */}
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

      {/* 진행 스텝 */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isCurrent ? 'text-purple-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* 스텝 컨텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && '캠페인의 기본 정보를 입력하세요.'}
            {currentStep === 2 && '캠페인에서 진행할 시술을 선택하세요. (나중에 추가 가능)'}
            {currentStep === 3 && '캠페인에 참여할 인플루언서를 선택하세요. AI가 시술에 적합한 인플루언서를 추천합니다.'}
            {currentStep === 4 && '촬영 및 경과사진 회차를 설정하세요.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: 기본 정보 */}
          {currentStep === 1 && (
            <>
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
                  <Label htmlFor="type">캠페인 유형</Label>
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
                      {(Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {CAMPAIGN_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
            </>
          )}

          {/* Step 2: 시술 선택 */}
          {currentStep === 2 && (
            <TreatmentSelector
              selectedIds={selectedTreatmentIds}
              onChange={handleTreatmentChange}
            />
          )}

          {/* Step 3: 인플루언서 선택 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* AI 추천 섹션 */}
              <InfluencerRecommender
                treatmentIds={selectedTreatmentIds}
                onSelect={(influencerId) => {
                  // 토글 방식으로 선택/해제
                  if (selectedInfluencerIds.includes(influencerId)) {
                    setSelectedInfluencerIds((prev) => prev.filter((id) => id !== influencerId))
                    setSelectedInfluencers((prev) => prev.filter((inf) => inf.id !== influencerId))
                  } else {
                    // 인플루언서 정보를 가져와서 추가
                    fetch(`/api/influencers/${influencerId}`)
                      .then((res) => res.json())
                      .then((influencer) => {
                        setSelectedInfluencerIds((prev) => [...prev, influencerId])
                        setSelectedInfluencers((prev) => [
                          ...prev,
                          {
                            id: influencer.id,
                            name: influencer.name,
                            nickname: influencer.nickname,
                            tier: influencer.tier,
                          },
                        ])
                      })
                      .catch(console.error)
                  }
                }}
                selectedInfluencerIds={selectedInfluencerIds}
              />

              {/* 기존 인플루언서 선택 */}
              <div className="border-t pt-6">
                <InfluencerSelector
                  selectedIds={selectedInfluencerIds}
                  onChange={handleInfluencerChange}
                />
              </div>
            </div>
          )}

          {/* Step 4: 회차 설정 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <RoundSettings
                shootingRounds={shootingRounds}
                progressRounds={progressRounds}
                onShootingChange={setShootingRounds}
                onProgressChange={setProgressRounds}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createSchedules"
                  checked={createSchedules}
                  onChange={(e) => setCreateSchedules(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="createSchedules" className="text-sm font-normal">
                  인플루언서별 일정 템플릿 자동 생성
                </Label>
              </div>

              {/* 요약 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">캠페인 요약</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">캠페인명:</span>
                    <span className="ml-2 font-medium">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">클라이언트:</span>
                    <span className="ml-2 font-medium">{formData.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">인플루언서:</span>
                    <span className="ml-2 font-medium">{selectedInfluencers.length}명</span>
                  </div>
                  <div>
                    <span className="text-gray-500">시술:</span>
                    <span className="ml-2 font-medium">{selectedTreatments.length}개</span>
                  </div>
                </div>

                {selectedInfluencers.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">선택된 인플루언서:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedInfluencers.map((inf) => (
                        <Badge key={inf.id} variant="secondary" className="text-xs">
                          {inf.nickname || inf.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTreatments.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">선택된 시술:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTreatments.map((t) => (
                        <Badge key={t.id} variant="secondary" className="text-xs">
                          {t.nameKo || t.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          이전
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            다음
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '생성 중...' : '캠페인 생성'}
          </Button>
        )}
      </div>
    </div>
  )
}
