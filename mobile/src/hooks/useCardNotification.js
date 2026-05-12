import { useEffect } from 'react'
import { NativeEventEmitter, NativeModules, Alert, Platform } from 'react-native'

// 카드사 알림에서 가맹점명, 금액 파싱
function parseCardNotification(text) {
  // 예: "스타벅스 5,000원 결제"
  const amountMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/)
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null

  // 가맹점명 추출 (금액 앞 텍스트)
  const merchantMatch = text.match(/^(.+?)\s+\d{1,3}(,\d{3})*\s*원/)
  const merchant = merchantMatch ? merchantMatch[1].trim() : text

  return { merchant, amount }
}

export default function useCardNotification(onDetected) {
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const eventEmitter = new NativeEventEmitter()
    const subscription = eventEmitter.addListener('CardNotification', (data) => {
      const [packageName, title, text] = data.split('|')
      const { merchant, amount } = parseCardNotification(text)

      if (amount) {
        Alert.alert(
          '카드 결제 감지',
          `${merchant} ${amount.toLocaleString()}원`,
          [
            { text: '무시', style: 'cancel' },
            { text: '탄소 계산', onPress: () => onDetected({ merchant, amount }) }
          ]
        )
      }
    })

    return () => subscription.remove()
  }, [])
}