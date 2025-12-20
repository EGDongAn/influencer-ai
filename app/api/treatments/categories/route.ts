import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/treatments/categories - 카테고리 목록 조회 (트리 구조)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flat = searchParams.get('flat') === 'true'

    const categories = await prisma.treatmentCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        treatments: {
          where: { isFeatured: true },
          select: {
            id: true,
            name: true,
            nameKo: true,
          },
        },
        _count: {
          select: { treatments: true, children: true },
        },
      },
    })

    if (flat) {
      return NextResponse.json(categories)
    }

    // 트리 구조로 변환
    const buildTree = (parentId: string | null): typeof categories => {
      return categories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }))
    }

    const tree = buildTree(null)
    return NextResponse.json(tree)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/treatments/categories - 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, nameKo, parentId, displayOrder, isFeatured } = body

    if (!name) {
      return NextResponse.json(
        { error: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // slug 생성 (영문 소문자, 하이픈)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // 중복 slug 확인
    const existingSlug = await prisma.treatmentCategory.findUnique({
      where: { slug },
    })

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

    const category = await prisma.treatmentCategory.create({
      data: {
        name,
        nameKo,
        slug: finalSlug,
        parentId,
        displayOrder: displayOrder || 0,
        isFeatured: isFeatured || false,
      },
      include: {
        parent: true,
        _count: {
          select: { treatments: true, children: true },
        },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
