import { useEffect } from 'react'
import useFetch from 'use-http'

export const SQL_ADVISOR_URL = process.env.REACT_APP_SQL_ADVISOR_URL
export const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL
export const DASHBOARD_API_URL = `${DASHBOARD_URL}/api`

const DASHBOARD_TOKEN_KEY = 'dashboard_token'

export const useLogin = () => {
  const { post, loading } = useFetch(DASHBOARD_API_URL)
  const login = async () => {
    const resp = await post(`user/login`, {
      username: process.env.REACT_APP_DB_USERNAME,
      password: process.env.REACT_APP_DB_PASSWORD,
      type: 0
    })
    localStorage.setItem(DASHBOARD_TOKEN_KEY, resp.token)
  }

  useEffect(() => {
    login()
  }, [])

  return { loading }
}

export const useDashboardFetch = () => {
  return useFetch(DASHBOARD_API_URL, (globalOptions) => {
    ;(globalOptions.headers as any)[
      'Authorization'
    ] = `Bearer ${localStorage.getItem(DASHBOARD_TOKEN_KEY)}`
    return globalOptions
  })
}
