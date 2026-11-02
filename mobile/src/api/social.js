// src/api/social.js
import client from './client'

export const listGroups = () =>
  client.get('/api/groups').then(r => r.data)

export const createGroup = (name) =>
  client.post('/api/groups', { name }).then(r => r.data)

export const joinGroup = (invite_code) =>
  client.post('/api/groups/join', { invite_code }).then(r => r.data)

export const getGroup = (groupId) =>
  client.get(`/api/groups/${groupId}`).then(r => r.data)

export const leaveGroup = (groupId) =>
  client.delete(`/api/groups/${groupId}/leave`).then(r => r.data)

export const getLeaderboard = (groupId, year, month) =>
  client.get(`/api/groups/${groupId}/leaderboard`, { params: { year, month, _: Date.now() } }).then(r => r.data)
