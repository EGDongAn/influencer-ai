import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedTreatment } from '@/lib/ai/embeddings'

// GET /api/treatments/[id] - 시술 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        treatmentCategory: true,
        collaborations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            collaboration: {
              include: {
                influencer: {
                  select: {
                    id: true,
                    name: true,
                    nickname: true,
                    tier: true,
                  },
                },
                campaign: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!treatment) {
      return NextResponse.json(
        { error: '시술을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(treatment)
  } catch (error) {
    console.error('Failed to fetch treatment:', error)
    return NextResponse.json(
      { error: '시술을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/treatments/[id] - 시술 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const treatment = await prisma.treatment.update({
      where: { id },
      data: body,
      include: {
        treatmentCategory: true,
      },
    })

    // 비동기로 임베딩 갱신 (응답 지연 방지)
    embedTreatment(treatment.id).catch(console.error)

    return NextResponse.json(treatment)
  } catch (error) {
    console.error('Failed to update treatment:', error)
    return NextResponse.json(
      { error: '시술 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/treatments/[id] - 시술 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 연결된 협업 확인
    const collabCount = await prisma.collaborationTreatment.count({
      where: { treatmentId: id },
    })

    if (collabCount > 0) {
      return NextResponse.json(
        { error: '연결된 협업이 있어 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.treatment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete treatment:', error)
    return NextResponse.json(
      { error: '시술 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
