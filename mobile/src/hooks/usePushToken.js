// src/hooks/usePushToken.js
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useEffect } from 'react'
import client from '../api/client'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function usePushToken() {
  useEffect(() => {
    registerPushToken()
  }, [])
}

async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId

    if (!projectId) {
      console.log('projectId 없음 — 푸시 알림 스킵')
      return
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId })
    await client.post('/api/auth/push-token', { token: token.data })
  } catch (e) {
    console.log('푸시 토큰 등록 실패:', e)
  }
}
