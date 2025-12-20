// Google Embedding 생성 및 저장
import { google } from '@ai-sdk/google'
import { embedMany, embed } from 'ai'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

// Google text-embedding-004 모델 (768차원)
const embeddingModel = google.textEmbeddingModel('text-embedding-004')

// 단일 텍스트 임베딩 생성
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  })
  return embedding
}

// 다중 텍스트 임베딩 생성
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  })
  return embeddings
}

// 인플루언서 임베딩 생성 및 저장
export async function embedInfluencer(influencerId: string): Promise<void> {
  const influencer = await prisma.influencer.findUnique({
    where: { id: influencerId },
    include: {
      channels: true,
      collaborations: {
        include: {
          campaign: true,
          treatments: {
            include: { treatment: true },
          },
        },
      },
    },
  })

  if (!influencer) throw new Error('Influencer not found')

  // 임베딩용 텍스트 구성
  const textParts = [
    `인플루언서: ${influencer.name}`,
    influencer.nickname ? `활동명: ${influencer.nickname}` : '',
    `티어: ${influencer.tier}`,
    `카테고리: ${influencer.category.join(', ')}`,
    influencer.notes ? `특이사항: ${influencer.notes}` : '',
    // 채널 정보
    ...influencer.channels.map(
      (ch) => `${ch.platform} 채널: ${ch.handle} (팔로워: ${ch.followerCount?.toLocaleString() || '미확인'})`
    ),
    // 협업 이력
    ...influencer.collaborations.map((collab) => {
      const treatments = collab.treatments.map((t) => t.treatment.name).join(', ')
      return `협업: ${collab.campaign.clientName} - ${collab.campaign.name}${treatments ? ` (시술: ${treatments})` : ''}`
    }),
  ].filter(Boolean)

  const text = textParts.join('\n')
  const embedding = await generateEmbedding(text)

  // Supabase에 임베딩 저장 (upsert)
  const { error } = await supabase.from('influencer_embeddings').upsert(
    {
      influencer_id: influencerId,
      embedding: embedding,
      content: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'influencer_id' }
  )

  if (error) throw new Error(`Failed to save embedding: ${error.message}`)
}

// 시술 임베딩 생성 및 저장
export async function embedTreatment(treatmentId: string): Promise<void> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
  })

  if (!treatment) throw new Error('Treatment not found')

  const textParts = [
    `시술명: ${treatment.name}`,
    treatment.nameKo ? `한국어명: ${treatment.nameKo}` : '',
    `카테고리: ${treatment.category}`,
    treatment.description ? `설명: ${treatment.description}` : '',
    treatment.duration ? `소요시간: ${treatment.duration}분` : '',
    treatment.priceMin && treatment.priceMax
      ? `가격대: ${Number(treatment.priceMin).toLocaleString()}~${Number(treatment.priceMax).toLocaleString()}원`
      : '',
    treatment.recoveryDays ? `회복기간: ${treatment.recoveryDays}일` : '',
  ].filter(Boolean)

  const text = textParts.join('\n')
  const embedding = await generateEmbedding(text)

  const { error } = await supabase.from('treatment_embeddings').upsert(
    {
      treatment_id: treatmentId,
      embedding: embedding,
      content: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'treatment_id' }
  )

  if (error) throw new Error(`Failed to save embedding: ${error.message}`)
}

// 콘텐츠 임베딩 생성 및 저장
export async function embedContent(contentId: string): Promise<void> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      channel: true,
      collaboration: {
        include: {
          influencer: true,
          campaign: true,
          treatments: {
            include: { treatment: true },
          },
        },
      },
    },
  })

  if (!content) throw new Error('Content not found')

  const treatments = content.collaboration.treatments.map((t) => t.treatment.name).join(', ')

  const textParts = [
    `콘텐츠: ${content.title || '제목 없음'}`,
    `플랫폼: ${content.channel.platform}`,
    `유형: ${content.contentType}`,
    `인플루언서: ${content.collaboration.influencer.name}`,
    `캠페인: ${content.collaboration.campaign.name}`,
    `병원: ${content.collaboration.campaign.clientName}`,
    treatments ? `시술: ${treatments}` : '',
    `조회수: ${content.views.toLocaleString()}`,
    `좋아요: ${content.likes.toLocaleString()}`,
    `댓글: ${content.comments.toLocaleString()}`,
    content.notes ? `메모: ${content.notes}` : '',
  ].filter(Boolean)

  const text = textParts.join('\n')
  const embedding = await generateEmbedding(text)

  const { error } = await supabase.from('content_embeddings').upsert(
    {
      content_id: contentId,
      embedding: embedding,
      content: text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'content_id' }
  )

  if (error) throw new Error(`Failed to save embedding: ${error.message}`)
}

// 전체 데이터 임베딩 동기화
export async function syncAllEmbeddings(): Promise<{
  influencers: number
  treatments: number
  contents: number
}> {
  const results = { influencers: 0, treatments: 0, contents: 0 }

  // 인플루언서 임베딩
  const influencers = await prisma.influencer.findMany({
    where: { isActive: true },
    select: { id: true },
  })
  for (const inf of influencers) {
    try {
      await embedInfluencer(inf.id)
      results.influencers++
    } catch (e) {
      console.error(`Failed to embed influencer ${inf.id}:`, e)
    }
  }

  // 시술 임베딩
  const treatments = await prisma.treatment.findMany({
    select: { id: true },
  })
  for (const tr of treatments) {
    try {
      await embedTreatment(tr.id)
      results.treatments++
    } catch (e) {
      console.error(`Failed to embed treatment ${tr.id}:`, e)
    }
  }

  // 콘텐츠 임베딩
  const contents = await prisma.content.findMany({
    select: { id: true },
  })
  for (const ct of contents) {
    try {
      await embedContent(ct.id)
      results.contents++
    } catch (e) {
      console.error(`Failed to embed content ${ct.id}:`, e)
    }
  }

  return results
}
