'use client'

import { useState } from 'react'
import { Wand2, Copy, Check, FileText, MessageSquare, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ReviewGeneratorProps {
  collaborationId?: string
  treatmentId?: string
  influencerId?: string
  treatmentName?: string
  influencerName?: string
}

export function ReviewGenerator({
  collaborationId,
  treatmentId,
  influencerId,
  treatmentName,
  influencerName,
}: ReviewGeneratorProps) {
  const [type, setType] = useState<'blog' | 'sns'>('blog')
  const [customPrompt, setCustomPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setCompletion('')

    try {
      const response = await fetch('/api/ai/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          collaborationId,
          treatmentId,
          influencerId,
          customPrompt,
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
      console.error('Generate review error:', error)
      setCompletion('후기 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (completion) {
      await navigator.clipboard.writeText(completion)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI 후기 생성
        </h3>
        {(treatmentName || influencerName) && (
          <p className="text-sm text-gray-500 mt-1">
            {treatmentName && <span className="font-medium">{treatmentName}</span>}
            {treatmentName && influencerName && ' · '}
            {influencerName && <span>{influencerName}</span>}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            후기 유형
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('blog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === 'blog'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              블로그 (1500자+)
            </button>
            <button
              onClick={() => setType('sns')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === 'sns'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              SNS 캡션 (300자)
            </button>
          </div>
        </div>

        {/* Custom Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            추가 요청사항 (선택)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="예: 회복 기간에 대해 자세히 작성해주세요, 자연스러운 톤으로..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              후기 생성
            </>
          )}
        </button>

        {/* Result */}
        {completion && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">생성된 후기</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    복사
                  </>
                )}
              </button>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{completion}</ReactMarkdown>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              * AI가 생성한 콘텐츠입니다. 사용 전 반드시 검토 및 수정하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
