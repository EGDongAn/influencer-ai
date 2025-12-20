'use client'

import { useState } from 'react'
import { FileBarChart, Loader2, Download, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type ReportType = 'campaign' | 'influencer' | 'monthly'

interface ReportViewerProps {
  type: ReportType
  campaignId?: string
  influencerId?: string
  campaignName?: string
  influencerName?: string
  year?: number
  month?: number
}

export function ReportViewer({
  type,
  campaignId,
  influencerId,
  campaignName,
  influencerName,
  year,
  month,
}: ReportViewerProps) {
  const [selectedYear] = useState(year || new Date().getFullYear())
  const [selectedMonth] = useState(month || new Date().getMonth() + 1)
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setCompletion('')

    try {
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          campaignId,
          influencerId,
          year: selectedYear,
          month: selectedMonth,
        }),
      })

      if (!response.ok) throw new Error('API 요청 실패')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('스트림을 읽을 수 없습니다')

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        content += chunk
        setCompletion(content)
      }
    } catch (error) {
      console.error('Generate report error:', error)
      setCompletion('리포트 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!completion) return

    const blob = new Blob([completion], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    let filename = ''
    switch (type) {
      case 'campaign':
        filename = `캠페인_리포트_${campaignName || campaignId}.md`
        break
      case 'influencer':
        filename = `인플루언서_리포트_${influencerName || influencerId}.md`
        break
      case 'monthly':
        filename = `월간_리포트_${selectedYear}년_${selectedMonth}월.md`
        break
    }

    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTitle = () => {
    switch (type) {
      case 'campaign':
        return `캠페인 리포트${campaignName ? `: ${campaignName}` : ''}`
      case 'influencer':
        return `인플루언서 리포트${influencerName ? `: ${influencerName}` : ''}`
      case 'monthly':
        return `${selectedYear}년 ${selectedMonth}월 월간 리포트`
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-blue-600" />
            {getTitle()}
          </h3>
        </div>
        <div className="flex gap-2">
          {completion && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              다운로드
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : completion ? (
              <>
                <RefreshCw className="h-4 w-4" />
                다시 생성
              </>
            ) : (
              <>
                <FileBarChart className="h-4 w-4" />
                리포트 생성
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!completion && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <FileBarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>리포트 생성 버튼을 클릭하여</p>
            <p>AI가 분석한 리포트를 확인하세요.</p>
          </div>
        )}

        {isLoading && !completion && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-500">AI가 리포트를 생성 중입니다...</p>
            <p className="text-sm text-gray-400 mt-1">잠시만 기다려주세요.</p>
          </div>
        )}

        {completion && (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{completion}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
