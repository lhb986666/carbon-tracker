import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'https://carbon-tracker.duckdns.org'

function parseCardNotification(text) {
  const lines = text.split('\n')

  const amountLine = lines.find(l => l.includes('승인금액') || l.includes('결제금액'))
  const amountMatch = amountLine ? amountLine.match(/([0-9,]+)\s*원/) : null
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null

  const merchantLine = lines.find(l => l.includes('가맹점명') || l.includes('가맹점'))
  const merchantMatch = merchantLine ? merchantLine.match(/가맹점명?[:\s]*(.+)/) : null
  const merchant = merchantMatch ? merchantMatch[1].trim() : '알 수 없음'

  return { merchant, amount }
}

export default async function CardNotificationTask(taskData) {
  try {
    const { data } = taskData
    if (!data) return

    const [packageName, title, text] = data.split('|')
    const { merchant, amount } = parseCardNotification(text)

    if (!amount) return

    const token = await AsyncStorage.getItem('token')
    if (!token) return

    await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ merchant, amount }),
    })

    console.log('백그라운드 탄소 계산 완료:', merchant, amount)
  } catch (e) {
    console.error('CardNotificationTask 오류:', e)
  }
}