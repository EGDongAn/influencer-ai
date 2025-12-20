'use client'

import { useState, useEffect } from 'react'
import { ReportViewer } from '@/components/ai/report-viewer'
import { FileBarChart, Users, Calendar, Loader2 } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  clientName: string
  status: string
}

interface Influencer {
  id: string
  name: string
  nickname: string | null
  tier: string
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'campaign' | 'influencer' | 'monthly'>('monthly')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, influencersRes] = await Promise.all([
          fetch('/api/campaigns'),
          fetch('/api/influencers'),
        ])

        if (campaignsRes.ok) {
          const data = await campaignsRes.json()
          setCampaigns(data)
        }

        if (influencersRes.ok) {
          const data = await influencersRes.json()
          setInfluencers(data)
        }
      } catch (e) {
        console.error('Failed to fetch data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const tabs = [
    { id: 'monthly', label: '월간 리포트', icon: Calendar },
    { id: 'campaign', label: '캠페인 리포트', icon: FileBarChart },
    { id: 'influencer', label: '인플루언서 리포트', icon: Users },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="h-7 w-7 text-blue-600" />
          AI 리포트
        </h1>
        <p className="text-gray-500 mt-1">AI가 분석한 상세 리포트를 확인하세요</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'monthly' && (
        <ReportViewer type="monthly" />
      )}

      {activeTab === 'campaign' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              캠페인 선택
            </label>
            <select
              value={selectedCampaign?.id || ''}
              onChange={(e) => {
                const campaign = campaigns.find((c) => c.id === e.target.value)
                setSelectedCampaign(campaign || null)
              }}
              className="w-full md:w-96 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">캠페인을 선택하세요</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.clientName} - {campaign.name} ({campaign.status})
                </option>
              ))}
            </select>
          </div>

          {selectedCampaign && (
            <ReportViewer
              type="campaign"
              campaignId={selectedCampaign.id}
              campaignName={`${selectedCampaign.clientName} - ${selectedCampaign.name}`}
            />
          )}
        </div>
      )}

      {activeTab === 'influencer' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인플루언서 선택
            </label>
            <select
              value={selectedInfluencer?.id || ''}
              onChange={(e) => {
                const influencer = influencers.find((i) => i.id === e.target.value)
                setSelectedInfluencer(influencer || null)
              }}
              className="w-full md:w-96 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">인플루언서를 선택하세요</option>
              {influencers.map((influencer) => (
                <option key={influencer.id} value={influencer.id}>
                  {influencer.name}
                  {influencer.nickname && ` (@${influencer.nickname})`} - {influencer.tier}
                </option>
              ))}
            </select>
          </div>

          {selectedInfluencer && (
            <ReportViewer
              type="influencer"
              influencerId={selectedInfluencer.id}
              influencerName={selectedInfluencer.name}
            />
          )}
        </div>
      )}
    </div>
  )
}
