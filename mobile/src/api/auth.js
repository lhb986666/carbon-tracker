// src/api/auth.js
import client from './client'

export const login = async (email, password) => {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)

  const response = await client.post('/api/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return response.data
}

export const register = (email, password, age_group, region) =>
  client.post('/api/auth/register', { email, password, age_group, region }).then(r => r.data)