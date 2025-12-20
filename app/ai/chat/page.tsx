'use client'

import { Suspense } from 'react'
import { ChatInterface } from '@/components/ai/chat-interface'
import { Loader2 } from 'lucide-react'

function ChatContent() {
  return (
    <div className="h-[calc(100vh-12rem)] rounded-xl border bg-white shadow-sm overflow-hidden">
      <ChatInterface />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-12rem)] rounded-xl border bg-white shadow-sm flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
