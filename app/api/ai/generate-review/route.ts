import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { NextRequest } from 'next/server'
import { SYSTEM_PROMPTS, buildReviewContext } from '@/lib/ai/prompts'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      type = 'blog', // 'blog' | 'sns'
      collaborationId,
      treatmentId,
      influencerId,
      customPrompt,
    } = body

    // 컨텍스트 정보 수집
    let treatment = null
    let influencer = null
    let collaboration = null

    if (treatmentId) {
      treatment = await prisma.treatment.findUnique({
        where: { id: treatmentId },
      })
    }

    if (influencerId) {
      const inf = await prisma.influencer.findUnique({
        where: { id: influencerId },
        include: { channels: true },
      })
      if (inf) {
        influencer = {
          name: inf.name,
          nickname: inf.nickname ?? undefined,
          tier: inf.tier,
          category: inf.category,
          channels: inf.channels.map((ch) => ({
            platform: ch.platform,
            handle: ch.handle,
          })),
        }
      }
    }

    if (collaborationId) {
      const collab = await prisma.collaboration.findUnique({
        where: { id: collaborationId },
        include: {
          campaign: true,
          influencer: { include: { channels: true } },
          treatments: { include: { treatment: true } },
        },
      })
      if (collab) {
        collaboration = {
          campaign: {
            name: collab.campaign.name,
            clientName: collab.campaign.clientName,
          },
          fee: collab.fee ? Number(collab.fee) : undefined,
          feeType: collab.feeType,
        }

        // 협업에서 인플루언서, 시술 정보 추출
        if (!influencer) {
          influencer = {
            name: collab.influencer.name,
            nickname: collab.influencer.nickname ?? undefined,
            tier: collab.influencer.tier,
            category: collab.influencer.category,
            channels: collab.influencer.channels.map((ch) => ({
              platform: ch.platform,
              handle: ch.handle,
            })),
          }
        }

        if (!treatment && collab.treatments.length > 0) {
          const t = collab.treatments[0].treatment
          treatment = {
            name: t.name,
            category: t.category,
            description: t.description,
            duration: t.duration,
            priceMin: t.priceMin ? Number(t.priceMin) : undefined,
            priceMax: t.priceMax ? Number(t.priceMax) : undefined,
            recoveryDays: t.recoveryDays,
          }
        }
      }
    }

    // 컨텍스트 구성
    const context = buildReviewContext({
      treatment: treatment
        ? {
            name: treatment.name,
            category: treatment.category ?? undefined,
            description: treatment.description ?? undefined,
            duration: treatment.duration ?? undefined,
            priceMin: treatment.priceMin ? Number(treatment.priceMin) : undefined,
            priceMax: treatment.priceMax ? Number(treatment.priceMax) : undefined,
            recoveryDays: treatment.recoveryDays ?? undefined,
          }
        : undefined,
      influencer: influencer ?? undefined,
      collaboration: collaboration ?? undefined,
      customPrompt,
    })

    // 시스템 프롬프트 선택
    const systemPrompt = type === 'sns' ? SYSTEM_PROMPTS.review_sns : SYSTEM_PROMPTS.review_blog

    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: context || '시술 후기를 작성해주세요.',
        },
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Generate review error:', error)
    return new Response(
      JSON.stringify({ error: '후기 생성 중 오류가 발생했습니다.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
