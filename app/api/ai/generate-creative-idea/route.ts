import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { NextRequest } from 'next/server'
import { SYSTEM_PROMPTS, buildCreativeIdeaContext } from '@/lib/ai/prompts'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaignId, customPrompt } = body

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaignId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 캠페인 정보 조회 (collaborations, influencers, treatments 포함)
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        collaborations: {
          include: {
            influencer: {
              include: {
                channels: true,
              },
            },
            treatments: {
              include: {
                treatment: true,
              },
            },
          },
        },
      },
    })

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 컨텍스트 구성
    const context = buildCreativeIdeaContext({
      campaign: {
        name: campaign.name,
        clientName: campaign.clientName,
        description: campaign.description ?? undefined,
        type: campaign.type,
        startDate: campaign.startDate,
        endDate: campaign.endDate ?? undefined,
      },
      collaborations: campaign.collaborations.map((collab) => ({
        influencer: {
          name: collab.influencer.name,
          nickname: collab.influencer.nickname ?? undefined,
          tier: collab.influencer.tier,
          category: collab.influencer.category,
          channels: collab.influencer.channels.map((ch) => ({
            platform: ch.platform,
            handle: ch.handle,
            followerCount: ch.followerCount ?? undefined,
          })),
        },
        treatments: collab.treatments.map((ct) => ({
          name: ct.treatment.name,
          category: ct.treatment.category ?? undefined,
          description: ct.treatment.description ?? undefined,
          recoveryDays: ct.treatment.recoveryDays ?? undefined,
        })),
        fee: collab.fee ? Number(collab.fee) : undefined,
        feeType: collab.feeType,
      })),
      customPrompt,
    })

    // Gemini 2.0 Flash로 스트리밍 응답 생성
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: SYSTEM_PROMPTS.creative_idea,
      messages: [
        {
          role: 'user',
          content: context || '캠페인 크리에이티브 아이디어를 생성해주세요.',
        },
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Generate creative idea error:', error)
    return new Response(
      JSON.stringify({ error: '크리에이티브 아이디어 생성 중 오류가 발생했습니다.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
