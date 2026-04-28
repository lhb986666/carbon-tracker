// src/services/paymentListener.js
import notifee from '@notifee/react-native'
import { parsePaymentNotification } from './notificationParser'
import client from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 알림 리스너 시작
export async function startPaymentListener() {
  // 알림 접근 권한 요청
  const settings = await notifee.requestPermission()
  if (!settings) return

  // 포그라운드 알림 리스너
  notifee.onForegroundEvent(async ({ type, detail }) => {
    await handleNotification(detail.notification)
  })

  // 백그라운드 알림 리스너
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    await handleNotification(detail.notification)
  })
}

async function handleNotification(notification) {
  if (!notification) return

  const title = notification.title || ''
  const body = notification.body || ''

  // 결제 알림인지 파싱
  const payment = parsePaymentNotification(title, body)
  if (!payment) return

  try {
    const token = await AsyncStorage.getItem('token')
    if (!token) return

    // 백엔드에 탄소 계산 요청
    const res = await client.post('/api/simulation', {
      merchant_name: payment.merchantName,
      amount: payment.amount,
    })

    console.log(`결제 감지: ${payment.merchantName} ${payment.amount}원 → ${res.data.carbon_kg} kg CO₂`)
  } catch (e) {
    console.log('탄소 계산 오류:', e)
  }
} 
