// src/screens/DashboardScreen.js
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { getMonthlyReport } from '../api/analysis'
import useCardNotification from '../hooks/useCardNotification'
import { uploadTransaction } from '../api/upload'

const screenWidth = Dimensions.get('window').width

export default function DashboardScreen() {
  const [total, setTotal] = useState(0)
  const [chartData, setChartData] = useState(null)
  const [equivalents, setEquivalents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [values, setValues] = useState([])

  const loadData = useCallback(() => {
    setLoading(true)
    getMonthlyReport().then(res => {
      setTotal(res.total_carbon_kg)
      setEquivalents(res.equivalents)
      const cats = Object.keys(res.by_category)
      const vals = Object.values(res.by_category)
      setCategories(cats)
      setValues(vals)
      if (cats.length > 0) {
        setChartData({
          labels: cats.map(c => c.length > 4 ? c.slice(0, 4) + '..' : c),
          datasets: [{ data: vals }]
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useFocusEffect(loadData)

  useCardNotification(async ({ merchant, amount, source }) => {
    try {
      await uploadTransaction({ merchant, amount, source })
      loadData()
    } catch (e) {
      console.error('자동 업로드 실패', e)
    }
  })

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 탄소 대시보드</Text>
        <Text style={styles.headerSub}>이번 달 탄소 배출량 현황</Text>
      </View>

      {/* 총 배출량 카드 */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>이번 달 총 배출량</Text>
        <Text style={styles.totalNum}>{total.toFixed(1)}</Text>
        <Text style={styles.totalUnit}>kg CO₂</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>
            {total < 50 ? '🟢 매우 낮음' : total < 100 ? '🟡 보통' : '🔴 높음'}
          </Text>
        </View>
      </View>

      {/* 등가 환산 */}
      {equivalents && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>등가 환산</Text>
          <View style={styles.equivRow}>
            <View style={styles.equivCard}>
              <Text style={styles.equivIcon}>🌳</Text>
              <Text style={styles.equivNum}>{equivalents.trees}</Text>
              <Text style={styles.equivLabel}>나무 그루</Text>
            </View>
            <View style={styles.equivCard}>
              <Text style={styles.equivIcon}>✈️</Text>
              <Text style={styles.equivNum}>{equivalents.flights_seoul_busan}</Text>
              <Text style={styles.equivLabel}>서울-부산{'\n'}항공</Text>
            </View>
            <View style={styles.equivCard}>
              <Text style={styles.equivIcon}>💨</Text>
              <Text style={styles.equivNum}>{equivalents.days_breathing}</Text>
              <Text style={styles.equivLabel}>성인{'\n'}호흡일수</Text>
            </View>
          </View>
        </View>
      )}

      {/* 업종별 차트 — 가로 스크롤 */}
      {chartData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>업종별 배출량</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartCard}>
              <BarChart
                data={chartData}
                width={Math.max(screenWidth - 64, categories.length * 80)}
                height={220}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 2,
                  color: () => '#16a34a',
                  labelColor: () => '#64748b',
                  barPercentage: 0.6,
                }}
                style={{ borderRadius: 8 }}
                showValuesOnTopOfBars
              />
            </View>
          </ScrollView>

          {/* 업종별 목록 */}
          <View style={styles.catList}>
            {categories.map((cat, i) => (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catDot} />
                <Text style={styles.catName}>{cat}</Text>
                <Text style={styles.catVal}>{values[i].toFixed(2)} kg CO₂</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!chartData && (
        <View style={styles.section}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>아직 데이터가 없어요</Text>
            <Text style={styles.emptySub}>CSV 업로드 또는 결제 시뮬레이션을 해보세요</Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  totalCard: {
    margin: 16, padding: 24,
    backgroundColor: '#16a34a', borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  totalLabel: { fontSize: 13, color: '#bbf7d0', marginBottom: 8 },
  totalNum: { fontSize: 56, fontWeight: '800', color: '#fff' },
  totalUnit: { fontSize: 16, color: '#bbf7d0', marginTop: 4 },
  totalBadge: {
    marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
  },
  totalBadgeText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 10 },
  equivRow: { flexDirection: 'row', gap: 8 },
  equivCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  equivIcon: { fontSize: 24, marginBottom: 6 },
  equivNum: { fontSize: 20, fontWeight: '700', color: '#14532d' },
  equivLabel: { fontSize: 11, color: '#6b7280', marginTop: 3, textAlign: 'center' },
  chartCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
    marginBottom: 10,
  },
  catList: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  catDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 10 },
  catName: { flex: 1, fontSize: 14, color: '#374151' },
  catVal: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  emptySub: { fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'center' },
})