import { useEffect, useRef } from 'react'
import { Alert, Platform, NativeModules } from 'react-native'

function parseCardNotification(text) {
  const amountMatch = text.match(/승인금액[:\s]*([0-9,]+)\s*원/) ||
                      text.match(/([0-9,]+)\s*원\s*결제/) ||
                      text.match(/(\d{1,3}(,\d{3})*)\s*원/)
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null

  const merchantMatch = text.match(/가맹점명[:\s]*(.+?)(\n|$)/) ||
                        text.match(/^(.+?)\s+\d{1,3}(,\d{3})*\s*원/)
  const merchant = merchantMatch ? merchantMatch[1].trim() : '알 수 없음'

  return { merchant, amount }
}

export default function useCardNotification(onDetected) {
  const lastTimestamp = useRef(0)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    console.log('useCardNotification 폴링 시작')

    const { SharedPreferencesModule } = NativeModules

    const interval = setInterval(async () => {
      try {
        const data = await SharedPreferencesModule.getString('CardNotification', 'latest')
        const timestamp = await SharedPreferencesModule.getLong('CardNotification', 'timestamp')

        if (data && timestamp > lastTimestamp.current) {
          lastTimestamp.current = timestamp
          console.log('새 카드 알림 감지:', data)

          const [packageName, title, text] = data.split('|')
          const { merchant, amount } = parseCardNotification(text)
          console.log('merchant:', merchant, 'amount:', amount)

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
        }
      } catch (e) {
        // 무시
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])
}