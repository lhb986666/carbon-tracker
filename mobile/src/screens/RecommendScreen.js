// src/screens/RecommendScreen.js
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { getRecommendations, getAIRecommendations } from '../api/analysis'

const PRIORITY_CONFIG = {
  high: { label: '높음', color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
  medium: { label: '보통', color: '#d97706', bg: '#fef3c7', icon: '🟡' },
  low: { label: '낮음', color: '#16a34a', bg: '#dcfce7', icon: '🟢' },
}

const TREND_CONFIG = {
  증가: { color: '#dc2626', bg: '#fee2e2', icon: '📈' },
  감소: { color: '#16a34a', bg: '#dcfce7', icon: '📉' },
  유지: { color: '#6b7280', bg: '#f3f4f6', icon: '➖' },
}

export default function RecommendScreen() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  const [aiData, setAiData] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth() + 1

      setLoading(true)
      getRecommendations().then(res => {
        setRecommendations(res)
      }).catch(() => {}).finally(() => setLoading(false))

      setAiLoading(true)
      getAIRecommendations(year, month).then(res => {
        setAiData(res)
      }).catch(() => {}).finally(() => setAiLoading(false))
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

      {/* AI 맞춤 분석 섹션 */}
      <View style={styles.section}>
        {aiLoading ? (
          <View style={styles.aiLoadingBox}>
            <Text style={styles.aiLoadingText}>✨ AI가 소비 추이를 분석하고 있어요...</Text>
          </View>
        ) : aiData && aiData.recommendations?.length > 0 && (
          <>
            <View style={styles.aiSectionHeader}>
              <Text style={styles.aiSectionTitle}>✨ AI 맞춤 분석</Text>
              <Text style={styles.aiSectionSub}>가맹점·개인 평균 기반</Text>
            </View>
            {aiData.source === 'gemini' ? (
              aiData.recommendations.map((item, index) => {
                const config = TREND_CONFIG[item.trend] || TREND_CONFIG.유지
                return (
                  <View key={index} style={styles.aiCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.category}>{item.category}</Text>
                      <View style={[styles.badge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.badgeText, { color: config.color }]}>
                          {config.icon} {item.trend}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.situationText}>{item.situation}</Text>

                    <View style={[styles.insightBox, { backgroundColor: config.bg }]}>
                      <Text style={[styles.insightText, { color: config.color }]}>
                        💡 {item.insight}
                      </Text>
                    </View>

                    <Text style={styles.actionText}>✅ {item.action}</Text>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNum, { color: '#16a34a' }]}>
                          -{item.expected_saving_krw?.toLocaleString()}원
                        </Text>
                        <Text style={styles.statLabel}>예상 절약</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNum, { color: config.color }]}>
                          -{item.expected_saving_kg}kg
                        </Text>
                        <Text style={styles.statLabel}>CO₂ 절감</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNum}>{item.expected_reduction_pct}%</Text>
                        <Text style={styles.statLabel}>감축률</Text>
                      </View>
                    </View>
                  </View>
                )
              })
            ) : (
              aiData.recommendations.map((item, index) => {
                const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low
                return (
                  <View key={index} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.category}>{item.category}</Text>
                      <View style={[styles.badge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.badgeText, { color: config.color }]}>
                          {config.icon} {config.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.action}>{item.action}</Text>
                    <Text style={styles.alternative}>{item.alternative}</Text>
                    <View style={styles.savingRow}>
                      <Text style={styles.savingLabel}>절감 가능</Text>
                      <Text style={[styles.savingNum, { color: config.color }]}>
                        -{item.saving_kg.toFixed(1)} kg CO₂
                      </Text>
                    </View>
                  </View>
                )
              })
            )}
          </>
        )}
      </View>

      {/* 기존 규칙 기반 추천 목록 */}
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
                <View style={styles.cardHeader}>
                  <Text style={styles.category}>{item.category}</Text>
                  <View style={[styles.badge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.badgeText, { color: config.color }]}>
                      {config.icon} {config.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.action}>{item.action}</Text>
                <Text style={styles.alternative}>{item.alternative}</Text>
                <View style={styles.savingRow}>
                  <Text style={styles.savingLabel}>절감 가능</Text>
                  <Text style={[styles.savingNum, { color: config.color }]}>
                    -{item.saving_kg.toFixed(1)} kg CO₂
                  </Text>
                </View>
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
  aiSectionHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  aiSectionTitle: { fontSize: 16, fontWeight: '700', color: '#14532d' },
  aiSectionSub: { fontSize: 11, color: '#9ca3af' },
  aiLoadingBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  aiLoadingText: { fontSize: 12, color: '#9ca3af' },
  aiCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  situationText: { fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  insightBox: { borderRadius: 8, padding: 8, marginBottom: 8 },
  insightText: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
  actionText: { fontSize: 13, color: '#1e293b', fontWeight: '600', marginBottom: 12, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  statItem: { alignItems: 'flex-start' },
  statNum: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
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