// src/screens/RecommendScreen.js
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { getRecommendations } from '../api/analysis'

export default function RecommendScreen() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecommendations().then(res => {
      setRecommendations(res)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>친환경 추천</Text>
      <Text style={styles.desc}>고탄소 소비 항목을 줄이는 방법이에요</Text>

      {recommendations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>CSV를 업로드하면 맞춤 추천이 표시돼요</Text>
        </View>
      ) : (
        recommendations.map((item, index) => (
          <View key={index} style={[styles.card, item.priority === 'high' && styles.cardHigh]}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{item.category}</Text>
              <View style={[styles.badge, item.priority === 'high' ? styles.badgeHigh : item.priority === 'medium' ? styles.badgeMed : styles.badgeLow]}>
                <Text style={styles.badgeText}>{item.priority === 'high' ? '높음' : item.priority === 'medium' ? '보통' : '낮음'}</Text>
              </View>
            </View>
            <Text style={styles.action}>{item.action}</Text>
            <Text style={styles.alternative}>{item.alternative}</Text>
            <View style={styles.savingRow}>
              <Text style={styles.savingLabel}>절감 가능</Text>
              <Text style={styles.savingNum}>-{item.saving_kg.toFixed(1)} kg CO₂</Text>
            </View>
            <Text style={styles.tip}>{item.tip}</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '600', padding: 20, paddingBottom: 4 },
  desc: { fontSize: 14, color: '#64748b', paddingHorizontal: 20, marginBottom: 16 },
  emptyCard: { margin: 16, padding: 24, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  card: { margin: 12, marginTop: 0, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#e2e8f0' },
  cardHigh: { borderColor: '#fca5a5', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  category: { fontSize: 15, fontWeight: '600', color: '#16a34a' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeHigh: { backgroundColor: '#fee2e2' },
  badgeMed: { backgroundColor: '#fef3c7' },
  badgeLow: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '500', color: '#374151' },
  action: { fontSize: 14, fontWeight: '500', color: '#1e293b', marginBottom: 4 },
  alternative: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  savingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  savingLabel: { fontSize: 12, color: '#94a3b8' },
  savingNum: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
  tip: { fontSize: 12, color: '#16a34a', backgroundColor: '#f0fdf4', padding: 8, borderRadius: 6 },
})