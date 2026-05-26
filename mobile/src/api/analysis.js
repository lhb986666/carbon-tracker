// src/api/analysis.js
import client from './client'

export const getMonthlyReport = (year, month) =>
  client.get('/api/analysis/monthly', { params: { year, month } }).then(r => r.data)

export const getTrend = () =>
  client.get('/api/analysis/trend').then(r => r.data)

export const getRecommendations = () =>
  client.get('/api/recommendations').then(r => r.data)