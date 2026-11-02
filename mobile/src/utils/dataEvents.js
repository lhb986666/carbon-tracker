// src/utils/dataEvents.js
// 거래 데이터가 바뀌었을 때(CSV 업로드 / 결제 입력 / 카드 알림 감지) 다른 화면에 알리는 아주 작은 이벤트 버스
const listeners = new Set()

export const subscribeDataChanged = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const emitDataChanged = () => {
  listeners.forEach((fn) => {
    try { fn() } catch (e) { /* 무시 */ }
  })
}
