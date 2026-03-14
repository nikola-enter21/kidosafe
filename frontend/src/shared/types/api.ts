export interface PaginatedResponse<T> {
  count: number
  offset: number
  limit: number
  next: string | null
  previous: string | null
  results: T[]
}

export type QueryParamValue = string | number | boolean | null | undefined