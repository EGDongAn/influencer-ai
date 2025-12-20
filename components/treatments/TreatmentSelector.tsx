'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, Plus, Search, X, ChevronRight, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Treatment {
  id: string
  name: string
  nameKo?: string | null
  isFeatured: boolean
  defaultShootingRounds: number
  defaultProgressRounds: number
  treatmentCategory?: {
    id: string
    name: string
    nameKo?: string | null
  } | null
}

interface TreatmentSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[], treatments: Treatment[]) => void
  maxSelection?: number
}

export function TreatmentSelector({
  selectedIds,
  onChange,
  maxSelection,
}: TreatmentSelectorProps) {
  const [featuredTreatments, setFeaturedTreatments] = useState<Treatment[]>([])
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTreatmentName, setNewTreatmentName] = useState('')
  const [addingTreatment, setAddingTreatment] = useState(false)

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async () => {
    try {
      const [featuredRes, allRes] = await Promise.all([
        fetch('/api/treatments/featured'),
        fetch('/api/treatments'),
      ])
      const featured = await featuredRes.json()
      const all = await allRes.json()
      setFeaturedTreatments(Array.isArray(featured) ? featured : [])
      setAllTreatments(Array.isArray(all) ? all : [])
    } catch (error) {
      console.error('Failed to fetch treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  // 검색 결과 필터링 (대표 시술 제외)
  const filteredTreatments = useMemo(() => {
    if (!searchQuery.trim()) return []

    const featuredIds = new Set(featuredTreatments.map((t) => t.id))
    return allTreatments
      .filter((t) => !featuredIds.has(t.id))
      .filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.nameKo?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10)
  }, [searchQuery, allTreatments, featuredTreatments])

  // 선택된 시술 목록
  const selectedTreatments = useMemo(() => {
    return allTreatments.filter((t) => selectedIds.includes(t.id))
  }, [selectedIds, allTreatments])

  const handleToggle = (treatment: Treatment) => {
    const isSelected = selectedIds.includes(treatment.id)
    let newIds: string[]
    let newTreatments: Treatment[]

    if (isSelected) {
      newIds = selectedIds.filter((id) => id !== treatment.id)
      newTreatments = selectedTreatments.filter((t) => t.id !== treatment.id)
    } else {
      if (maxSelection && selectedIds.length >= maxSelection) {
        return
      }
      newIds = [...selectedIds, treatment.id]
      newTreatments = [...selectedTreatments, treatment]
    }

    onChange(newIds, newTreatments)
  }

  const handleRemove = (treatmentId: string) => {
    const newIds = selectedIds.filter((id) => id !== treatmentId)
    const newTreatments = selectedTreatments.filter((t) => t.id !== treatmentId)
    onChange(newIds, newTreatments)
  }

  const handleAddTreatment = async () => {
    if (!newTreatmentName.trim()) return

    setAddingTreatment(true)
    try {
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTreatmentName.trim(),
          defaultShootingRounds: 1,
          defaultProgressRounds: 2,
        }),
      })

      if (response.ok) {
        const newTreatment = await response.json()
        setAllTreatments((prev) => [...prev, newTreatment])

        // 새 시술 자동 선택
        onChange([...selectedIds, newTreatment.id], [...selectedTreatments, newTreatment])

        setNewTreatmentName('')
        setShowAddDialog(false)
      }
    } catch (error) {
      console.error('Failed to add treatment:', error)
    } finally {
      setAddingTreatment(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 선택된 시술 표시 */}
      {selectedTreatments.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">선택된 시술</Label>
          <div className="flex flex-wrap gap-2">
            {selectedTreatments.map((treatment) => (
              <Badge
                key={treatment.id}
                variant="secondary"
                className="pl-3 pr-1 py-1.5 flex items-center gap-1"
              >
                {treatment.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                {treatment.nameKo || treatment.name}
                <button
                  onClick={() => handleRemove(treatment.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 대표 시술 체크박스 */}
      {featuredTreatments.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            대표 시술
          </Label>
          <div className="flex flex-wrap gap-2">
            {featuredTreatments.map((treatment) => {
              const isSelected = selectedIds.includes(treatment.id)
              return (
                <button
                  key={treatment.id}
                  onClick={() => handleToggle(treatment)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all
                    ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  {treatment.nameKo || treatment.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 시술 검색 */}
      <div>
        <Label className="text-sm font-medium mb-2 block">시술 검색</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="시술명을 검색하세요..."
            className="pl-10"
          />
        </div>

        {/* 검색 결과 */}
        {searchQuery && (
          <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
            {filteredTreatments.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                검색 결과가 없습니다.
                <button
                  onClick={() => {
                    setNewTreatmentName(searchQuery)
                    setShowAddDialog(true)
                  }}
                  className="block w-full mt-2 text-purple-600 hover:underline"
                >
                  &quot;{searchQuery}&quot; 시술 추가하기
                </button>
              </div>
            ) : (
              filteredTreatments.map((treatment) => {
                const isSelected = selectedIds.includes(treatment.id)
                return (
                  <button
                    key={treatment.id}
                    onClick={() => handleToggle(treatment)}
                    className={`w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 ${
                      isSelected ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {treatment.nameKo || treatment.name}
                      </div>
                      {treatment.treatmentCategory && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {treatment.treatmentCategory.nameKo ||
                            treatment.treatmentCategory.name}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-purple-600" />}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* 새 시술 추가 버튼 */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowAddDialog(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        새 시술 추가
      </Button>

      {/* 새 시술 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 시술 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="treatmentName">시술명</Label>
              <Input
                id="treatmentName"
                value={newTreatmentName}
                onChange={(e) => setNewTreatmentName(e.target.value)}
                placeholder="예: 보톡스"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleAddTreatment} disabled={addingTreatment}>
              {addingTreatment ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
