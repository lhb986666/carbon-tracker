// src/services/notificationParser.js

// 카드사/페이 알림 패턴 정의
const PAYMENT_PATTERNS = [
  // 카카오페이: [카카오페이] 스타벅스 6,500원 결제
  {
    regex: /\[?카카오페이\]?\s+(.+?)\s+([\d,]+)원\s*(결제|승인)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // 삼성페이: 스타벅스 6,500원 승인
  {
    regex: /삼성페이.+?(.+?)\s+([\d,]+)원\s*(승인|결제)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // 신한카드: 신한카드 스타벅스 6,500원 승인
  {
    regex: /신한카드\s+(.+?)\s+([\d,]+)원\s*(승인|결제)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // KB국민카드: KB카드 스타벅스 6,500원 승인
  {
    regex: /KB카드\s+(.+?)\s+([\d,]+)원\s*(승인|결제)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // 현대카드: 현대카드 스타벅스 6,500원 승인
  {
    regex: /현대카드\s+(.+?)\s+([\d,]+)원\s*(승인|결제)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // 하나카드: 하나카드 스타벅스 6,500원 승인
  {
    regex: /하나카드\s+(.+?)\s+([\d,]+)원\s*(승인|결제)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // 네이버페이: 네이버페이 스타벅스 6,500원 결제
  {
    regex: /네이버페이\s+(.+?)\s+([\d,]+)원\s*(결제|승인)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
  // 범용 패턴: 가맹점명 금액원 승인/결제
  {
    regex: /(.+?)\s+([\d,]+)원\s*(승인|결제)/,
    merchantGroup: 1,
    amountGroup: 2,
  },
]

export function parsePaymentNotification(title, body) {
  const text = `${title} ${body}`.trim()

  for (const pattern of PAYMENT_PATTERNS) {
    const match = text.match(pattern.regex)
    if (match) {
      const merchantName = match[pattern.merchantGroup].trim()
      const amount = parseInt(match[pattern.amountGroup].replace(/,/g, ''))

      if (merchantName && amount > 0) {
        return { merchantName, amount }
      }
    }
  }
  return null
}  
