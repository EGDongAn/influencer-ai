import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/treatments/featured - 대표 시술 5개 조회
export async function GET() {
  try {
    const treatments = await prisma.treatment.findMany({
      where: { isFeatured: true },
      orderBy: { name: 'asc' },
      take: 5,
      include: {
        treatmentCategory: {
          select: {
            id: true,
            name: true,
            nameKo: true,
          },
        },
      },
    })

    return NextResponse.json(treatments)
  } catch (error) {
    console.error('Failed to fetch featured treatments:', error)
    return NextResponse.json(
      { error: '대표 시술을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/treatments/featured - 대표 시술 설정 (최대 5개)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { treatmentIds } = body

    if (!Array.isArray(treatmentIds)) {
      return NextResponse.json(
        { error: '시술 ID 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    if (treatmentIds.length > 5) {
      return NextResponse.json(
        { error: '대표 시술은 최대 5개까지만 설정할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 기존 대표 시술 해제
      await tx.treatment.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      })

      // 새 대표 시술 설정
      if (treatmentIds.length > 0) {
        await tx.treatment.updateMany({
          where: { id: { in: treatmentIds } },
          data: { isFeatured: true },
        })
      }
    })

    // 업데이트된 대표 시술 반환
    const treatments = await prisma.treatment.findMany({
      where: { isFeatured: true },
      orderBy: { name: 'asc' },
      include: {
        treatmentCategory: {
          select: {
            id: true,
            name: true,
            nameKo: true,
          },
        },
      },
    })

    return NextResponse.json(treatments)
  } catch (error) {
    console.error('Failed to update featured treatments:', error)
    return NextResponse.json(
      { error: '대표 시술 설정에 실패했습니다.' },
      { status: 500 }
    )
  }
}
