import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/treatments/categories/[id] - 카테고리 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.treatmentCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { displayOrder: 'asc' },
        },
        treatments: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            nameKo: true,
            isFeatured: true,
            defaultShootingRounds: true,
            defaultProgressRounds: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return NextResponse.json(
      { error: '카테고리를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/treatments/categories/[id] - 카테고리 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, nameKo, parentId, displayOrder, isFeatured } = body

    const category = await prisma.treatmentCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameKo !== undefined && { nameKo }),
        ...(parentId !== undefined && { parentId }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
      include: {
        parent: true,
        _count: {
          select: { treatments: true, children: true },
        },
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/treatments/categories/[id] - 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 하위 카테고리 확인
    const childCount = await prisma.treatmentCategory.count({
      where: { parentId: id },
    })

    if (childCount > 0) {
      return NextResponse.json(
        { error: '하위 카테고리가 있어 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 연결된 시술 확인
    const treatmentCount = await prisma.treatment.count({
      where: { categoryId: id },
    })

    if (treatmentCount > 0) {
      return NextResponse.json(
        { error: '연결된 시술이 있어 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.treatmentCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
