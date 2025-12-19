import { z } from 'zod'

// Enums
export const InfluencerTierSchema = z.enum(['VIP', 'GOLD', 'SILVER', 'BRONZE'])
export const PlatformSchema = z.enum([
  'YOUTUBE',
  'INSTAGRAM',
  'TIKTOK',
  'BLOG_NAVER',
  'BLOG_OTHER',
  'FACEBOOK',
  'TWITTER',
  'OTHER',
])
export const CampaignTypeSchema = z.enum([
  'COLLABORATION',
  'ADVERTISEMENT',
  'EVENT',
  'REVIEW',
  'OTHER',
])
export const CampaignStatusSchema = z.enum([
  'PLANNING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])
export const CollaborationStatusSchema = z.enum([
  'CONTACTED',
  'NEGOTIATING',
  'CONFIRMED',
  'SHOOTING_DONE',
  'PROGRESS_DONE',
  'UPLOADED',
  'COMPLETED',
  'CANCELLED',
])
export const FeeTypeSchema = z.enum([
  'FIXED',
  'PER_CONTENT',
  'REVENUE_SHARE',
  'BARTER',
])
export const ContentTypeSchema = z.enum([
  'VIDEO',
  'SHORTS',
  'IMAGE',
  'BLOG',
  'STORY',
  'OTHER',
])

// Channel Schema
export const ChannelSchema = z.object({
  platform: PlatformSchema,
  handle: z.string().min(1, '채널명을 입력하세요'),
  url: z.string().url('유효한 URL을 입력하세요').optional().or(z.literal('')),
  followerCount: z.number().int().positive().optional(),
})

// Influencer Schemas
export const CreateInfluencerSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  nickname: z.string().optional(),
  email: z.string().email('유효한 이메일을 입력하세요').optional().or(z.literal('')),
  phone: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  tier: InfluencerTierSchema.default('SILVER'),
  category: z.array(z.string()).default([]),
  notes: z.string().optional(),
  channels: z.array(ChannelSchema).optional(),
})

export const UpdateInfluencerSchema = CreateInfluencerSchema.partial()

// Campaign Schemas
export const CreateCampaignSchema = z.object({
  name: z.string().min(1, '캠페인명을 입력하세요'),
  description: z.string().optional(),
  clientName: z.string().min(1, '클라이언트명을 입력하세요'),
  clientContact: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  type: CampaignTypeSchema.default('COLLABORATION'),
  budget: z.number().positive().optional().nullable(),
  status: CampaignStatusSchema.default('PLANNING'),
  notes: z.string().optional(),
}).refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  { message: '종료일은 시작일 이후여야 합니다', path: ['endDate'] }
)

export const UpdateCampaignSchema = CreateCampaignSchema.partial()

// Collaboration Schemas
export const CreateCollaborationSchema = z.object({
  campaignId: z.string().cuid('유효한 캠페인을 선택하세요'),
  influencerId: z.string().cuid('유효한 인플루언서를 선택하세요'),
  fee: z.number().positive().optional().nullable(),
  feeType: FeeTypeSchema.default('FIXED'),
  shootingDate: z.coerce.date().optional().nullable(),
  progressDate: z.coerce.date().optional().nullable(),
  uploadDeadline: z.coerce.date().optional().nullable(),
  status: CollaborationStatusSchema.default('CONTACTED'),
  notes: z.string().optional(),
})

export const UpdateCollaborationSchema = CreateCollaborationSchema.partial()

export const UpdateCollaborationStatusSchema = z.object({
  status: CollaborationStatusSchema,
})

// Content Schemas
export const CreateContentSchema = z.object({
  collaborationId: z.string().cuid('유효한 협업을 선택하세요'),
  channelId: z.string().cuid('유효한 채널을 선택하세요'),
  title: z.string().optional(),
  url: z.string().url('유효한 URL을 입력하세요'),
  contentType: ContentTypeSchema.default('VIDEO'),
  uploadedAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
})

export const UpdateContentSchema = CreateContentSchema.partial()

export const UpdateContentMetricsSchema = z.object({
  views: z.number().int().nonnegative().optional(),
  likes: z.number().int().nonnegative().optional(),
  comments: z.number().int().nonnegative().optional(),
  shares: z.number().int().nonnegative().optional(),
})

// API Error Response
export interface ApiError {
  error: string
  details?: z.ZodIssue[]
}

// Validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ApiError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: {
      error: '입력값이 올바르지 않습니다',
      details: result.error.issues,
    },
  }
}
