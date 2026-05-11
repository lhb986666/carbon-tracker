// src/api/auth.js
const BASE_URL = 'https://carbon-tracker.duckdns.org'

export const login = async (email, password) => {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  
  if (!response.ok) throw new Error('Login failed')
  return response.json()
}

export const register = async (email, password, age_group, region) => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, age_group, region })
  })
  if (!response.ok) throw new Error('Register failed')
  return response.json()
}