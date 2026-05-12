// src/api/upload.js
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'https://carbon-tracker.duckdns.org'

export const uploadCSV = async (formData) => {
  const token = await AsyncStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
  if (!response.ok) throw new Error('Upload failed')
  return response.json()
}

export const getUploadList = async () => {
  const token = await AsyncStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/uploads`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed')
  return response.json()
}

export const uploadTransaction = async ({ merchant, amount }) => {
  const token = await AsyncStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ merchant, amount }),
  })
  if (!response.ok) throw new Error('Transaction upload failed')
  return response.json()
}