// src/api/analysis.js
import client from './client'

export const getMonthlyReport = (year, month) =>
  client.get('/api/analysis/monthly', { params: { year, month } }).then(r => r.data)

export const getDailyBalance = (day) =>
  client.get('/api/analysis/daily-balance', { params: { day, _: Date.now() } }).then(r => r.data)

export const getActiveDays = (year, month) =>
  client.get('/api/analysis/active-days', { params: { year, month, _: Date.now() } }).then(r => r.data)

export const getTrend = () =>
  client.get('/api/analysis/trend').then(r => r.data)

export const getRecommendations = () =>
  client.get('/api/recommendations').then(r => r.data)

export const getAIRecommendations = (year, month) =>
  client.get('/api/recommendations/ai', { params: { year, month } }).then(r => r.data)