type SearchParamValue = string | number | boolean | null | undefined

export function toSearchParams(params: Record<string, SearchParamValue>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    searchParams.set(key, String(value))
  })

  return searchParams.toString()
}