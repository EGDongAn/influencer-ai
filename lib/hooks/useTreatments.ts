// SWR 기반 시술 데이터 훅
import useSWR, { mutate } from 'swr'

export interface TreatmentQueryOptions {
  search?: string
  categoryId?: string
  featured?: boolean
}

export interface Treatment {
  id: string
  name: string
  nameKo: string | null
  categoryId: string | null
  category: string | null
  manualId: string | null
  description: string | null
  duration: number | null
  priceMin: number | null
  priceMax: number | null
  recoveryDays: number | null
  defaultShootingRounds: number
  defaultProgressRounds: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  syncedAt: string | null
  treatmentCategory?: {
    id: string
    name: string
    nameKo: string | null
    slug: string
  } | null
}

export interface TreatmentCategory {
  id: string
  name: string
  nameKo: string | null
  slug: string
  parentId: string | null
  displayOrder: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  children?: TreatmentCategory[]
  treatments?: Treatment[]
  _count?: {
    treatments: number
    children: number
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('시술 데이터를 불러오는데 실패했습니다.')
  }
  return res.json()
}

function buildTreatmentQueryString(options: TreatmentQueryOptions): string {
  const params = new URLSearchParams()

  if (options.search) params.append('search', options.search)
  if (options.categoryId) params.append('categoryId', options.categoryId)
  if (options.featured !== undefined) params.append('featured', String(options.featured))

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

// 시술 목록 훅
export function useTreatments(options: TreatmentQueryOptions = {}) {
  const queryString = buildTreatmentQueryString(options)
  const { data, error, isLoading, isValidating } = useSWR<Treatment[]>(
    `/api/treatments${queryString}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  )

  return {
    treatments: data || [],
    isLoading,
    isValidating,
    error,
  }
}

// 대표 시술 훅
export function useFeaturedTreatments() {
  const { data, error, isLoading, isValidating } = useSWR<Treatment[]>(
    '/api/treatments/featured',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    featuredTreatments: data || [],
    isLoading,
    isValidating,
    error,
  }
}

// 개별 시술 훅
export function useTreatment(id: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<Treatment>(
    id ? `/api/treatments/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  )

  return {
    treatment: data,
    isLoading,
    isValidating,
    error,
  }
}

// 카테고리 목록 훅
export function useTreatmentCategories(tree: boolean = false) {
  const { data, error, isLoading, isValidating } = useSWR<TreatmentCategory[]>(
    `/api/treatments/categories${tree ? '?tree=true' : ''}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    categories: data || [],
    isLoading,
    isValidating,
    error,
  }
}

// 개별 카테고리 훅
export function useTreatmentCategory(id: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<TreatmentCategory>(
    id ? `/api/treatments/categories/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  )

  return {
    category: data,
    isLoading,
    isValidating,
    error,
  }
}

// 시술 캐시 무효화
export function invalidateTreatments(options?: TreatmentQueryOptions) {
  if (options) {
    const queryString = buildTreatmentQueryString(options)
    mutate(`/api/treatments${queryString}`)
  } else {
    mutate((key) => typeof key === 'string' && key.startsWith('/api/treatments'))
  }
}

export function invalidateTreatment(id: string) {
  mutate(`/api/treatments/${id}`)
}

export function invalidateFeaturedTreatments() {
  mutate('/api/treatments/featured')
}

export function invalidateCategories() {
  mutate((key) => typeof key === 'string' && key.includes('/api/treatments/categories'))
}

// 시술 생성
export async function createTreatment(data: Partial<Treatment>) {
  const res = await fetch('/api/treatments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '시술 생성에 실패했습니다.')
  }

  const treatment = await res.json()
  invalidateTreatments()
  if (treatment.isFeatured) {
    invalidateFeaturedTreatments()
  }
  return treatment
}

// 시술 수정
export async function updateTreatment(id: string, data: Partial<Treatment>) {
  const res = await fetch(`/api/treatments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '시술 수정에 실패했습니다.')
  }

  const treatment = await res.json()
  invalidateTreatment(id)
  invalidateTreatments()
  invalidateFeaturedTreatments()
  return treatment
}

// 시술 삭제
export async function deleteTreatment(id: string) {
  const res = await fetch(`/api/treatments/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '시술 삭제에 실패했습니다.')
  }

  invalidateTreatments()
  invalidateFeaturedTreatments()
}

// 대표 시술 설정
export async function setFeaturedTreatments(treatmentIds: string[]) {
  const res = await fetch('/api/treatments/featured', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ treatmentIds }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '대표 시술 설정에 실패했습니다.')
  }

  const treatments = await res.json()
  invalidateFeaturedTreatments()
  invalidateTreatments()
  return treatments
}

// 카테고리 생성
export async function createCategory(data: Partial<TreatmentCategory>) {
  const res = await fetch('/api/treatments/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '카테고리 생성에 실패했습니다.')
  }

  const category = await res.json()
  invalidateCategories()
  return category
}

// 카테고리 수정
export async function updateCategory(id: string, data: Partial<TreatmentCategory>) {
  const res = await fetch(`/api/treatments/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '카테고리 수정에 실패했습니다.')
  }

  const category = await res.json()
  invalidateCategories()
  return category
}

// 카테고리 삭제
export async function deleteCategory(id: string) {
  const res = await fetch(`/api/treatments/categories/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '카테고리 삭제에 실패했습니다.')
  }

  invalidateCategories()
}
