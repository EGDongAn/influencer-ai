'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Camera, Image } from 'lucide-react'

interface RoundSettingsProps {
  shootingRounds: number
  progressRounds: number
  onShootingChange: (value: number) => void
  onProgressChange: (value: number) => void
  disabled?: boolean
}

export function RoundSettings({
  shootingRounds,
  progressRounds,
  onShootingChange,
  onProgressChange,
  disabled = false,
}: RoundSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* 촬영 회차 */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Camera className="h-4 w-4 text-purple-600" />
            촬영 회차
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={10}
              value={shootingRounds}
              onChange={(e) => onShootingChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-20 text-center"
            />
            <span className="text-sm text-gray-500">회</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            촬영 일정이 {shootingRounds}회 생성됩니다
          </p>
        </div>

        {/* 경과 사진 회차 */}
        <div>
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Image className="h-4 w-4 text-blue-600" />
            경과 사진 회차
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={20}
              value={progressRounds}
              onChange={(e) => onProgressChange(parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-20 text-center"
            />
            <span className="text-sm text-gray-500">회</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            경과 사진 일정이 {progressRounds}회 생성됩니다
          </p>
        </div>
      </div>

      {/* 요약 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm text-gray-600">
          총 <span className="font-bold text-gray-900">{shootingRounds + progressRounds}</span>개의
          일정이 생성됩니다
          <span className="text-xs text-gray-400 ml-2">
            (촬영 {shootingRounds}회 + 경과 {progressRounds}회)
          </span>
        </div>
      </div>
    </div>
  )
}
