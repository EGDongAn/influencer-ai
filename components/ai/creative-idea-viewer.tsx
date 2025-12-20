'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Copy, Check, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface CreativeIdeaViewerProps {
  campaignId: string
  autoGenerate?: boolean
}

export function CreativeIdeaViewer({ campaignId, autoGenerate = false }: CreativeIdeaViewerProps) {
  const [copied, setCopied] = useState(false)
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setCompletion('')

    try {
      const response = await fetch('/api/ai/generate-creative-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
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
      console.error('Generate creative idea error:', error)
      setCompletion('크리에이티브 아이디어 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
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

  useEffect(() => {
    if (autoGenerate) {
      handleGenerate()
    }
  }, [autoGenerate])

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI 크리에이티브 아이디어
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          캠페인 목적에 맞는 창의적인 콘텐츠 아이디어를 생성합니다
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
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
              <Sparkles className="h-5 w-5" />
              아이디어 생성
            </>
          )}
        </button>

        {/* Result */}
        {completion && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">생성된 아이디어</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="다시 생성"
                >
                  <RefreshCw className="h-4 w-4" />
                  재생성
                </button>
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
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{completion}</ReactMarkdown>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              * AI가 생성한 콘텐츠입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
