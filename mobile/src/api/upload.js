// src/api/upload.js
import client from './client'

export const uploadCSV = (formData) =>
  client.post('/api/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

export const getUploadList = () =>
  client.get('/api/uploads').then(r => r.data)