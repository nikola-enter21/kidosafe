const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
export const BASE_URL = rawBaseUrl.replace(/\/+$/, '')

const rawMlUrl = import.meta.env.VITE_ML_API_URL ?? 'http://localhost:8001'
export const ML_API_URL = rawMlUrl.replace(/\/+$/, '')