import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedTreatment } from '@/lib/ai/embeddings'

// GET /api/treatments - 시술 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured') === 'true'
    const limit = searchParams.get('limit')

    const where: {
      name?: { contains: string; mode: 'insensitive' }
      categoryId?: string
      isFeatured?: boolean
    } = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (featured) {
      where.isFeatured = true
    }

    const treatments = await prisma.treatment.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
      take: limit ? parseInt(limit) : undefined,
      include: {
        treatmentCategory: {
          select: {
            id: true,
            name: true,
            nameKo: true,
          },
        },
        _count: {
          select: { collaborations: true },
        },
      },
    })

    return NextResponse.json(treatments)
  } catch (error) {
    console.error('Failed to fetch treatments:', error)
    return NextResponse.json(
      { error: '시술 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/treatments - 시술 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      nameKo,
      categoryId,
      category, // legacy field
      description,
      duration,
      priceMin,
      priceMax,
      recoveryDays,
      defaultShootingRounds,
      defaultProgressRounds,
      isFeatured,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: '시술 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    const treatment = await prisma.treatment.create({
      data: {
        name,
        nameKo,
        categoryId,
        category,
        description,
        duration,
        priceMin,
        priceMax,
        recoveryDays,
        defaultShootingRounds: defaultShootingRounds || 1,
        defaultProgressRounds: defaultProgressRounds || 2,
        isFeatured: isFeatured || false,
      },
      include: {
        treatmentCategory: true,
      },
    })

    // 비동기로 임베딩 생성 (응답 지연 방지)
    embedTreatment(treatment.id).catch(console.error)

    return NextResponse.json(treatment, { status: 201 })
  } catch (error) {
    console.error('Failed to create treatment:', error)
    return NextResponse.json(
      { error: '시술 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
