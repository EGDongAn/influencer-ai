// Prisma 모델 기반 타입 정의
import type {
  Influencer,
  Channel,
  Campaign,
  Collaboration,
  Content,
  Schedule,
  InfluencerTier,
  Platform,
  CampaignType,
  CampaignStatus,
  CollaborationStatus,
  FeeType,
  ContentType,
  ScheduleType,
  ScheduleStatus,
} from '@prisma/client'

// Re-export Prisma enums
export type {
  InfluencerTier,
  Platform,
  CampaignType,
  CampaignStatus,
  CollaborationStatus,
  FeeType,
  ContentType,
  ScheduleType,
  ScheduleStatus,
}

// Re-export Prisma models
export type { Schedule }

// 인플루언서 with relations
export type InfluencerWithChannels = Influencer & {
  channels: Channel[]
}

export type InfluencerWithCollaborations = Influencer & {
  channels: Channel[]
  collaborations: (Collaboration & {
    campaign: Campaign
    contents: Content[]
  })[]
}

export type InfluencerListItem = Influencer & {
  channels: Channel[]
  _count: {
    collaborations: number
  }
}

// 캠페인 with relations
export type CampaignWithCollaborations = Campaign & {
  collaborations: (Collaboration & {
    influencer: Pick<Influencer, 'id' | 'name' | 'nickname' | 'tier' | 'profileImageUrl'>
  })[]
  _count: {
    collaborations: number
  }
}

export type CampaignDetail = Campaign & {
  collaborations: (Collaboration & {
    influencer: Influencer & {
      channels: Channel[]
    }
    contents: Content[]
  })[]
}

// 협업 with relations
export type CollaborationWithRelations = Collaboration & {
  campaign: Campaign
  influencer: Influencer & {
    channels: Channel[]
  }
  contents: Content[]
  schedules: Schedule[]
}

export type CollaborationForKanban = Collaboration & {
  campaign: Pick<Campaign, 'id' | 'name' | 'clientName'>
  influencer: Pick<Influencer, 'id' | 'name' | 'nickname' | 'tier' | 'profileImageUrl'>
  schedules: Schedule[]
}

// 스케줄 with relations
export type ScheduleWithRelations = Schedule & {
  collaboration: Collaboration & {
    campaign: Pick<Campaign, 'id' | 'name' | 'clientName'>
    influencer: Pick<Influencer, 'id' | 'name' | 'nickname'>
  }
}

// 대시보드 타입
export interface DashboardStats {
  influencers: {
    total: number
    VIP: number
    GOLD: number
    SILVER: number
    BRONZE: number
  }
  campaigns: {
    active: number
    completedThisMonth: number
  }
  schedule: {
    total: number
    shooting: number
    upload: number
  }
  content: {
    total: number
    views: number
    likes: number
    comments: number
  }
  activeCollaborations: CollaborationForKanban[]
  upcomingSchedules: ScheduleWithRelations[]
}

// 폼 데이터 타입
export interface InfluencerFormData {
  name: string
  nickname?: string
  email?: string
  phone?: string
  profileImageUrl?: string
  tier: InfluencerTier
  category: string[]
  notes?: string
  channels: {
    platform: Platform
    handle: string
    url?: string
    followerCount?: number
  }[]
}

export interface CampaignFormData {
  name: string
  description?: string
  clientName: string
  clientContact?: string
  startDate: string
  endDate?: string
  type: CampaignType
  budget?: number
  status: CampaignStatus
  notes?: string
}

export interface CollaborationFormData {
  campaignId: string
  influencerId: string
  fee?: number
  feeType: FeeType
  shootingDate?: string
  progressDate?: string
  uploadDeadline?: string
  status: CollaborationStatus
  notes?: string
}

// 유틸리티 타입
export const TIER_LABELS: Record<InfluencerTier, string> = {
  VIP: 'VIP',
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
}

export const TIER_COLORS: Record<InfluencerTier, string> = {
  VIP: 'bg-purple-100 text-purple-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  SILVER: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-orange-100 text-orange-800',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  BLOG_NAVER: '네이버 블로그',
  BLOG_OTHER: '기타 블로그',
  FACEBOOK: 'Facebook',
  TWITTER: 'Twitter/X',
  OTHER: '기타',
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  COLLABORATION: '협찬',
  ADVERTISEMENT: '광고',
  EVENT: '이벤트',
  REVIEW: '리뷰',
  OTHER: '기타',
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  PLANNING: '기획 중',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
}

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  PLANNING: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const COLLABORATION_STATUS_LABELS: Record<CollaborationStatus, string> = {
  CONTACTED: '컨택 완료',
  NEGOTIATING: '협의 중',
  CONFIRMED: '확정',
  SHOOTING_DONE: '촬영 완료',
  PROGRESS_DONE: '경과사진 완료',
  UPLOADED: '업로드 완료',
  COMPLETED: '협업 완료',
  CANCELLED: '취소됨',
}

export const COLLABORATION_STATUS_COLORS: Record<CollaborationStatus, string> = {
  CONTACTED: 'bg-blue-100 text-blue-800',
  NEGOTIATING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  SHOOTING_DONE: 'bg-purple-100 text-purple-800',
  PROGRESS_DONE: 'bg-indigo-100 text-indigo-800',
  UPLOADED: 'bg-pink-100 text-pink-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  FIXED: '고정 금액',
  PER_CONTENT: '콘텐츠당',
  REVENUE_SHARE: '수익 분배',
  BARTER: '시술 제공',
}

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  SHOOTING: '촬영',
  PROGRESS: '경과 사진',
  UPLOAD: '업로드',
  MEETING: '미팅',
  REVIEW: '검토',
  OTHER: '기타',
}

export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  SHOOTING: 'bg-purple-100 text-purple-800 border-purple-300',
  PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  UPLOAD: 'bg-green-100 text-green-800 border-green-300',
  MEETING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  REVIEW: 'bg-orange-100 text-orange-800 border-orange-300',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-300',
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  SCHEDULED: '예정됨',
  CONFIRMED: '확정됨',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  RESCHEDULED: '일정 변경',
}

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-orange-100 text-orange-800',
}

// 스케줄 폼 데이터
export interface ScheduleFormData {
  collaborationId: string
  type: ScheduleType
  title?: string
  scheduledDate: string
  scheduledTime?: string
  notes?: string
}
