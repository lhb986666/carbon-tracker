// src/screens/DashboardScreen.js
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { useEffect, useState } from 'react'
import { getMonthlyReport } from '../api/analysis'
import AsyncStorage from '@react-native-async-storage/async-storage'

const screenWidth = Dimensions.get('window').width

export default function DashboardScreen() {
  const [total, setTotal] = useState(0)
  const [chartData, setChartData] = useState(null)
  const [equivalents, setEquivalents] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMonthlyReport().then(res => {
      setTotal(res.total_carbon_kg)
      setEquivalents(res.equivalents)
      const categories = Object.keys(res.by_category)
      const values = Object.values(res.by_category)
      if (categories.length > 0) {
        setChartData({
          labels: categories,
          datasets: [{ data: values }]
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>이번 달 탄소 배출량</Text>
      <View style={styles.totalCard}>
        <Text style={styles.totalNum}>{total.toFixed(1)}</Text>
        <Text style={styles.totalUnit}>kg CO₂</Text>
      </View>

      {equivalents && (
        <View style={styles.equivRow}>
          <View style={styles.equivCard}>
            <Text style={styles.equivNum}>{equivalents.trees}</Text>
            <Text style={styles.equivLabel}>나무 그루</Text>
          </View>
          <View style={styles.equivCard}>
            <Text style={styles.equivNum}>{equivalents.flights_seoul_busan}</Text>
            <Text style={styles.equivLabel}>서울-부산 항공</Text>
          </View>
          <View style={styles.equivCard}>
            <Text style={styles.equivNum}>{equivalents.days_breathing}</Text>
            <Text style={styles.equivLabel}>성인 호흡일수</Text>
          </View>
        </View>
      )}

      {chartData && (
        <>
          <Text style={styles.sectionTitle}>업종별 배출량</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: () => '#16a34a',
              labelColor: () => '#64748b',
            }}
            style={{ marginHorizontal: 16, borderRadius: 12 }}
          />
        </>
      )}

      {!chartData && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>CSV를 업로드하면 분석 결과가 여기에 표시돼요</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', padding: 20, paddingBottom: 8 },
  totalCard: { margin: 16, padding: 20, backgroundColor: '#16a34a', borderRadius: 12, alignItems: 'center' },
  totalNum: { fontSize: 48, fontWeight: '700', color: '#fff' },
  totalUnit: { fontSize: 16, color: '#bbf7d0', marginTop: 4 },
  equivRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 8 },
  equivCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#e2e8f0' },
  equivNum: { fontSize: 18, fontWeight: '600', color: '#16a34a' },
  equivLabel: { fontSize: 11, color: '#64748b', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: 16, marginTop: 8 },
  emptyCard: { margin: 16, padding: 24, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
})