// src/components/DailyBalance.js
// 하루 탄소 수지: 아침 → 저녁 결제 흐름에 따른 배출(+) / 절감(−), 실제 결제 시각 기준
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import Svg, { Line, Path, Circle, Text as SvgText } from 'react-native-svg'
import { getActiveDays, getDailyBalance } from '../api/analysis'
import { subscribeDataChanged } from '../utils/dataEvents'

const fmt = (n) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2))

export default function DailyBalance({ year, month }) {
  const [days, setDays] = useState([])
  const [day, setDay] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const dayRef = useRef('')
  dayRef.current = day

  // 선택한 달의 거래 있는 날짜 목록. 선택한 날짜가 아직 있으면 유지, 아니면 가장 최근 날짜
  const loadDays = useCallback(() => {
    return getActiveDays(year, month)
      .then((list) => {
        setDays(list)
        if (list.length === 0) {
          setDay('')
          setData(null)
          setLoading(false)
        } else if (!list.some((d) => d.date === dayRef.current)) {
          setDay(list[0].date)
        }
        return list
      })
      .catch(() => setLoading(false))
  }, [year, month])

  const loadBalance = useCallback((target) => {
    if (!target) return Promise.resolve()
    return getDailyBalance(target)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 달이 바뀌면 날짜 목록 새로 (선택 초기화)
  useEffect(() => {
    setLoading(true)
    setDay('')
    loadDays()
  }, [year, month])

  // 선택한 날짜가 바뀌면 그 날 수지 불러오기
  useEffect(() => {
    if (!day) return
    setLoading(true)
    loadBalance(day)
  }, [day])

  // 화면에 돌아올 때, 그리고 결제/CSV/카드 감지 직후 = 실시간 갱신
  const refresh = useCallback(() => {
    loadDays().then(() => loadBalance(dayRef.current))
  }, [loadDays, loadBalance])

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))
  useEffect(() => subscribeDataChanged(refresh), [refresh])

  if (loading && !data) {
    return <View style={styles.center}><ActivityIndicator color="#16a34a" /></View>
  }
  if (days.length === 0 || !data) {
    return <Text style={styles.empty}>이 달에는 하루 단위로 볼 거래가 없어요</Text>
  }

  const net = data.net_kg

  return (
    <View>
      {/* 날짜 선택 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {days.map((d) => (
          <TouchableOpacity
            key={d.date}
            style={[styles.dayChip, d.date === day && styles.dayChipActive]}
            onPress={() => setDay(d.date)}
          >
            <Text style={[styles.dayText, d.date === day && styles.dayTextActive]}>
              {d.date.slice(5).replace('-', '/')} ({d.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 요약 */}
      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.pillText, { color: '#b91c1c' }]}>+ 배출 {fmt(data.total_emission_kg)}kg</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.pillText, { color: '#15803d' }]}>− 절감 {fmt(data.total_saved_kg)}kg</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: '#f3f4f6' }]}>
          <Text style={[styles.pillText, { color: '#111' }]}>순 {net > 0 ? '+' : ''}{fmt(net)}kg</Text>
        </View>
      </View>

      <FlowChart items={data.items} />

      {/* 시간순 목록 */}
      <View style={{ marginTop: 6 }}>
        {data.items.map((it) => (
          <View key={it.id} style={styles.row}>
            <View style={styles.timeCol}>
              <Text style={styles.time}>{it.time}</Text>
              <Text style={styles.slot}>{it.slot}{it.time_estimated ? ' · 추정' : ''}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchant} numberOfLines={1}>
                {it.merchant} <Text style={styles.cat}>· {it.category}</Text>
              </Text>
              {it.saved_kg > 0 && (
                <Text style={styles.saved}>{it.baseline} 대비 {fmt(it.saved_kg)}kg 절감 👏</Text>
              )}
              {it.potential_saving_kg > 0 && (
                <Text style={styles.tip}>💡 {it.tip} → −{fmt(it.potential_saving_kg)}kg 가능</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.plus}>+{fmt(it.emission_kg)}</Text>
              {it.saved_kg > 0 && <Text style={styles.minus}>−{fmt(it.saved_kg)}</Text>}
            </View>
          </View>
        ))}
      </View>

      {data.potential_saving_kg > 0 && (
        <View style={styles.potential}>
          <Text style={styles.potentialText}>
            추천대로 실천하면 이 날 <Text style={{ fontWeight: '700' }}>−{fmt(data.potential_saving_kg)}kg</Text> 더 줄일 수 있어요
          </Text>
        </View>
      )}
      {data.time_is_estimated && (
        <Text style={styles.note}>* '추정'으로 표시된 거래는 결제 시각이 없어 업종별 시간대로 순서를 추정했어요.</Text>
      )}
    </View>
  )
}

// 하루 흐름에 따른 누적 탄소(순 배출) 계단 그래프
function FlowChart({ items }) {
  if (items.length === 0) return null
  const W = 300, H = 110, P = 14
  const pts = [{ v: 0 }, ...items.map((it) => ({ v: it.cumulative_kg }))]
  const vals = pts.map((p) => p.v)
  const min = Math.min(0, ...vals)
  const max = Math.max(0.0001, ...vals)
  const xs = (i) => P + (i / (pts.length - 1 || 1)) * (W - P * 2)
  const ys = (v) => H - P - ((v - min) / (max - min || 1)) * (H - P * 2)
  const path = pts
    .map((p, i) => (i === 0 ? `M ${xs(i)} ${ys(p.v)}` : `L ${xs(i)} ${ys(pts[i - 1].v)} L ${xs(i)} ${ys(p.v)}`))
    .join(' ')

  return (
    <View style={styles.chartBox}>
      <Svg width="100%" height={150} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={P} x2={W - P} y1={ys(0)} y2={ys(0)} stroke="#ddd" strokeDasharray="4 4" />
        <Path d={path} fill="none" stroke="#16a34a" strokeWidth="2.5" />
        {pts.slice(1).map((p, i) => {
          const up = items[i].emission_kg - items[i].saved_kg >= 0
          return <Circle key={i} cx={xs(i + 1)} cy={ys(p.v)} r="4" fill={up ? '#ef4444' : '#16a34a'} />
        })}
        <SvgText x={P} y={10} fontSize="9" fill="#999">아침</SvgText>
        <SvgText x={W - P} y={10} fontSize="9" fill="#999" textAnchor="end">저녁</SvgText>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { padding: 24, alignItems: 'center' },
  empty: { color: '#9ca3af', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#f3f4f6', marginRight: 8,
  },
  dayChipActive: { backgroundColor: '#16a34a' },
  dayText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  dayTextActive: { color: '#fff', fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '600' },
  chartBox: { backgroundColor: '#fafafa', borderRadius: 10, padding: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
  },
  timeCol: { width: 52 },
  time: { fontSize: 13, fontWeight: '700', color: '#374151' },
  slot: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  merchant: { fontSize: 14, fontWeight: '500', color: '#111' },
  cat: { fontSize: 11, color: '#9ca3af', fontWeight: '400' },
  saved: { fontSize: 11, color: '#15803d', marginTop: 2 },
  tip: { fontSize: 11, color: '#a16207', marginTop: 2 },
  plus: { fontSize: 14, fontWeight: '700', color: '#b91c1c' },
  minus: { fontSize: 14, fontWeight: '700', color: '#15803d' },
  potential: { marginTop: 12, backgroundColor: '#fffbeb', borderRadius: 10, padding: 12 },
  potentialText: { fontSize: 13, color: '#a16207' },
  note: { fontSize: 11, color: '#bbb', marginTop: 10 },
})
