import ky from 'ky'
import { useCallback, useState } from 'react'
import useSWR from 'swr'

import { BASE_URL } from '@/shared/config/urls'
import { toSearchParams } from '@/shared/lib/urls'
import type { PaginatedResponse, QueryParamValue } from '@/shared/types/api'

export { BASE_URL }

function resolveApiUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export const get = async <Response>(url: string): Promise<Response> => {
  return ky(resolveApiUrl(url)).json<Response>()
}

export const post = async <Response, Data = unknown>(
  url: string,
  data?: Data,
): Promise<Response> => {
  return ky.post(resolveApiUrl(url), { json: data }).json<Response>()
}

export const put = async <Response, Data = unknown>(
  url: string,
  data?: Data,
): Promise<Response> => {
  return ky.put(resolveApiUrl(url), { json: data }).json<Response>()
}

export const del = async (url: string): Promise<void> => {
  await ky.delete(resolveApiUrl(url))
}

export function useFetch<Data>(url: string | undefined) {
  return useSWR<Data>(url, get)
}

type UsePaginatedFetchParams = {
  url: string | undefined
  params: Record<string, QueryParamValue> & {
    limit: number
  }
}

export function usePaginatedFetch<Item>({ url, params }: UsePaginatedFetchParams) {
  const { limit } = params
  const [offset, setOffset] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const query = url
    ? `${url}?${toSearchParams({
        offset,
        ...params,
      })}`
    : undefined

  const fetchResult = useFetch<PaginatedResponse<Item>>(query)
  const pagesCount = fetchResult.data
    ? Math.ceil(fetchResult.data.count / fetchResult.data.limit)
    : 0

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(page)
      setOffset(limit * (page - 1))
    },
    [limit],
  )

  return {
    offset,
    setOffset,
    currentPage,
    setCurrentPage,
    pagesCount,
    setPage,
    ...fetchResult,
  }
}