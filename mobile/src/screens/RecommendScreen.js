// src/screens/RecommendScreen.js
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { getRecommendations } from '../api/analysis'

const PRIORITY_CONFIG = {
  high: { label: '높음', color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
  medium: { label: '보통', color: '#d97706', bg: '#fef3c7', icon: '🟡' },
  low: { label: '낮음', color: '#16a34a', bg: '#dcfce7', icon: '🟢' },
}

export default function RecommendScreen() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      getRecommendations().then(res => {
        setRecommendations(res)
      }).catch(() => {}).finally(() => setLoading(false))
    }, [])
  )

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  const highCount = recommendations.filter(r => r.priority === 'high').length
  const totalSaving = recommendations.reduce((s, r) => s + (r.saving_kg || 0), 0)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌱 친환경 추천</Text>
        <Text style={styles.headerSub}>고탄소 소비 항목을 줄이는 방법이에요</Text>
      </View>

      {/* 요약 카드 */}
      {recommendations.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{recommendations.length}</Text>
            <Text style={styles.summaryLabel}>추천 항목</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: '#dc2626' }]}>{highCount}</Text>
            <Text style={styles.summaryLabel}>우선 개선</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: '#16a34a' }]}>{totalSaving.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>절감 가능 kg</Text>
          </View>
        </View>
      )}

      {/* 추천 목록 */}
      <View style={styles.section}>
        {recommendations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyText}>아직 추천 항목이 없어요</Text>
            <Text style={styles.emptySub}>CSV 업로드 또는 결제 시뮬레이션을 하면{'\n'}맞춤 추천이 표시돼요</Text>
          </View>
        ) : (
          recommendations.map((item, index) => {
            const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low
            return (
              <View key={index} style={styles.card}>
                {/* 카드 헤더 */}
                <View style={styles.cardHeader}>
                  <Text style={styles.category}>{item.category}</Text>
                  <View style={[styles.badge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.badgeText, { color: config.color }]}>
                      {config.icon} {config.label}
                    </Text>
                  </View>
                </View>

                {/* 액션 */}
                <Text style={styles.action}>{item.action}</Text>
                <Text style={styles.alternative}>{item.alternative}</Text>

                {/* 절감량 */}
                <View style={styles.savingRow}>
                  <Text style={styles.savingLabel}>절감 가능</Text>
                  <Text style={[styles.savingNum, { color: config.color }]}>
                    -{item.saving_kg.toFixed(1)} kg CO₂
                  </Text>
                </View>

                {/* 팁 */}
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>{item.tip}</Text>
                </View>
              </View>
            )
          })
        )}
      </View>

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
  summaryCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  section: { marginHorizontal: 16 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  emptySub: { fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 16, fontWeight: '700', color: '#14532d' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  action: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  alternative: { fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 18 },
  savingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  savingLabel: { fontSize: 12, color: '#9ca3af' },
  savingNum: { fontSize: 15, fontWeight: '700' },
  tipBox: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 },
  tipText: { fontSize: 12, color: '#16a34a', lineHeight: 18 },
})