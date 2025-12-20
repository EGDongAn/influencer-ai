import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { NextRequest } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      type, // 'campaign' | 'influencer' | 'monthly'
      campaignId,
      influencerId,
      year,
      month,
    } = body

    let context = ''
    let systemPrompt = ''

    switch (type) {
      case 'campaign': {
        if (!campaignId) {
          return new Response(
            JSON.stringify({ error: 'campaignId가 필요합니다.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: {
            collaborations: {
              include: {
                influencer: { include: { channels: true } },
                contents: true,
                treatments: { include: { treatment: true } },
                schedules: true,
              },
            },
          },
        })

        if (!campaign) {
          return new Response(
            JSON.stringify({ error: '캠페인을 찾을 수 없습니다.' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          )
        }

        const totalViews = campaign.collaborations.reduce(
          (sum, c) => sum + c.contents.reduce((s, ct) => s + ct.views, 0),
          0
        )
        const totalLikes = campaign.collaborations.reduce(
          (sum, c) => sum + c.contents.reduce((s, ct) => s + ct.likes, 0),
          0
        )
        const totalComments = campaign.collaborations.reduce(
          (sum, c) => sum + c.contents.reduce((s, ct) => s + ct.comments, 0),
          0
        )
        const totalFee = campaign.collaborations.reduce(
          (sum, c) => sum + (c.fee ? Number(c.fee) : 0),
          0
        )

        context = `# 캠페인 정보
- 캠페인명: ${campaign.name}
- 병원: ${campaign.clientName}
- 상태: ${campaign.status}
- 기간: ${campaign.startDate.toLocaleDateString('ko-KR')} ~ ${campaign.endDate?.toLocaleDateString('ko-KR') || '진행중'}
- 예산: ${campaign.budget ? Number(campaign.budget).toLocaleString() + '원' : '미정'}
- 총 협찬비: ${totalFee.toLocaleString()}원

# 참여 인플루언서 (${campaign.collaborations.length}명)
${campaign.collaborations
  .map(
    (c) => `
## ${c.influencer.name} (${c.influencer.tier})
- 상태: ${c.status}
- 협찬비: ${c.fee ? Number(c.fee).toLocaleString() + '원' : '바터'}
- 시술: ${c.treatments.map((t) => t.treatment.name).join(', ') || '없음'}
- 콘텐츠: ${c.contents.length}개
- 일정: ${c.schedules.length}개
${c.contents.length > 0 ? `- 콘텐츠 성과: 조회 ${c.contents.reduce((s, ct) => s + ct.views, 0).toLocaleString()}, 좋아요 ${c.contents.reduce((s, ct) => s + ct.likes, 0).toLocaleString()}, 댓글 ${c.contents.reduce((s, ct) => s + ct.comments, 0).toLocaleString()}` : ''}
`
  )
  .join('\n')}

# 전체 성과
- 총 조회수: ${totalViews.toLocaleString()}
- 총 좋아요: ${totalLikes.toLocaleString()}
- 총 댓글: ${totalComments.toLocaleString()}
- CPV: ${totalViews > 0 ? Math.round(totalFee / totalViews).toLocaleString() + '원' : 'N/A'}
- CPE: ${totalLikes + totalComments > 0 ? Math.round(totalFee / (totalLikes + totalComments)).toLocaleString() + '원' : 'N/A'}
`

        systemPrompt = SYSTEM_PROMPTS.report_campaign
        break
      }

      case 'influencer': {
        if (!influencerId) {
          return new Response(
            JSON.stringify({ error: 'influencerId가 필요합니다.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        const influencer = await prisma.influencer.findUnique({
          where: { id: influencerId },
          include: {
            channels: true,
            collaborations: {
              include: {
                campaign: true,
                contents: true,
                treatments: { include: { treatment: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        if (!influencer) {
          return new Response(
            JSON.stringify({ error: '인플루언서를 찾을 수 없습니다.' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          )
        }

        const allContents = influencer.collaborations.flatMap((c) => c.contents)
        const avgViews =
          allContents.length > 0
            ? Math.round(allContents.reduce((s, c) => s + c.views, 0) / allContents.length)
            : 0
        const avgLikes =
          allContents.length > 0
            ? Math.round(allContents.reduce((s, c) => s + c.likes, 0) / allContents.length)
            : 0

        const treatmentCounts: Record<string, number> = {}
        influencer.collaborations.forEach((c) => {
          c.treatments.forEach((t) => {
            treatmentCounts[t.treatment.name] = (treatmentCounts[t.treatment.name] || 0) + 1
          })
        })

        context = `# 인플루언서 프로필
- 이름: ${influencer.name}
- 활동명: ${influencer.nickname || '없음'}
- 티어: ${influencer.tier}
- 카테고리: ${influencer.category.join(', ')}
- 채널: ${influencer.channels.map((ch) => `${ch.platform}(${ch.handle})`).join(', ')}

# 협업 이력 (총 ${influencer.collaborations.length}회)
${influencer.collaborations.slice(0, 10).map((c) => `- ${c.campaign.clientName} - ${c.campaign.name} (${c.status})`).join('\n')}

# 시술 분야
${Object.entries(treatmentCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([name, count]) => `- ${name}: ${count}회`)
  .join('\n')}

# 콘텐츠 성과
- 총 콘텐츠: ${allContents.length}개
- 평균 조회수: ${avgViews.toLocaleString()}
- 평균 좋아요: ${avgLikes.toLocaleString()}

# 특이사항
${influencer.notes || '없음'}
`

        systemPrompt = SYSTEM_PROMPTS.report_influencer
        break
      }

      case 'monthly': {
        const targetYear = year || new Date().getFullYear()
        const targetMonth = month || new Date().getMonth() + 1

        const startDate = new Date(targetYear, targetMonth - 1, 1)
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

        const [campaigns, influencers, collaborations, contents, schedules] = await Promise.all([
          prisma.campaign.findMany({
            where: {
              OR: [
                { startDate: { gte: startDate, lte: endDate } },
                { status: 'IN_PROGRESS', startDate: { lte: endDate } },
              ],
            },
          }),
          prisma.influencer.findMany({
            where: { isActive: true },
          }),
          prisma.collaboration.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: {
              campaign: true,
              influencer: true,
            },
          }),
          prisma.content.findMany({
            where: { uploadedAt: { gte: startDate, lte: endDate } },
          }),
          prisma.schedule.findMany({
            where: { scheduledDate: { gte: startDate, lte: endDate } },
            include: {
              collaboration: {
                include: {
                  influencer: true,
                  campaign: true,
                },
              },
            },
          }),
        ])

        const totalViews = contents.reduce((s, c) => s + c.views, 0)
        const totalLikes = contents.reduce((s, c) => s + c.likes, 0)

        context = `# ${targetYear}년 ${targetMonth}월 월간 리포트

## 캠페인 현황
- 진행 중: ${campaigns.filter((c) => c.status === 'IN_PROGRESS').length}개
- 완료: ${campaigns.filter((c) => c.status === 'COMPLETED').length}개
- 신규: ${campaigns.filter((c) => c.createdAt >= startDate).length}개

## 인플루언서 현황
- 활동 인플루언서: ${influencers.length}명
- VIP: ${influencers.filter((i) => i.tier === 'VIP').length}명
- Gold: ${influencers.filter((i) => i.tier === 'GOLD').length}명
- Silver: ${influencers.filter((i) => i.tier === 'SILVER').length}명
- Bronze: ${influencers.filter((i) => i.tier === 'BRONZE').length}명

## 협업 현황
- 이번 달 신규 협업: ${collaborations.length}건
${collaborations.slice(0, 10).map((c) => `- ${c.influencer.name} - ${c.campaign.name} (${c.status})`).join('\n')}

## 콘텐츠 성과
- 업로드된 콘텐츠: ${contents.length}개
- 총 조회수: ${totalViews.toLocaleString()}
- 총 좋아요: ${totalLikes.toLocaleString()}

## 일정 현황
- 완료된 일정: ${schedules.filter((s) => s.status === 'COMPLETED').length}건
- 예정된 일정: ${schedules.filter((s) => s.status === 'SCHEDULED' || s.status === 'CONFIRMED').length}건
- 취소된 일정: ${schedules.filter((s) => s.status === 'CANCELLED').length}건
`

        systemPrompt = SYSTEM_PROMPTS.report_monthly
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'type은 campaign, influencer, monthly 중 하나여야 합니다.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Generate report error:', error)
    return new Response(
      JSON.stringify({ error: '리포트 생성 중 오류가 발생했습니다.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
