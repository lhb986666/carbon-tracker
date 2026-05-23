// src/screens/MyPageScreen.js
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import client from '../api/client'

const SOURCE_LABEL = {
  csv: { label: 'CSV', color: '#2563eb', bg: '#eff6ff' },
  simulation: { label: '시뮬레이션', color: '#7c3aed', bg: '#f5f3ff' },
  notification: { label: '카드감지', color: '#d97706', bg: '#fffbeb' },
}

export default function MyPageScreen({ navigation }) {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCarbon, setTotalCarbon] = useState(0)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [meRes, txRes] = await Promise.all([
        client.get('/api/auth/me'),
        client.get('/api/transactions'),
      ])
      setUser(meRes.data)
      const txList = txRes.data || []
      setTransactions(txList)
      const total = txList.reduce((s, t) => s + (t.carbon_kg || 0), 0)
      setTotalCarbon(total)
    } catch (e) {
      try {
        const txRes = await client.get('/api/transactions')
        const txList = txRes.data || []
        setTransactions(txList)
        const total = txList.reduce((s, t) => s + (t.carbon_kg || 0), 0)
        setTotalCarbon(total)
      } catch {}
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('token')
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        }
      }
    ])
  }

  const getSource = (tx) => {
    if (tx.source) return tx.source
    if (tx.upload_id) return 'csv'
    if (tx.is_simulation) return 'simulation'
    return 'notification'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🌿</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userEmail}>{user?.email || '사용자'}</Text>
          <Text style={styles.userSub}>탄소발자국 추적기 사용자</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{transactions.length}</Text>
          <Text style={styles.statLabel}>총 거래</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#16a34a' }]}>{totalCarbon.toFixed(2)}</Text>
          <Text style={styles.statLabel}>kg CO₂</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {transactions.filter(t => getSource(t) === 'notification').length}
          </Text>
          <Text style={styles.statLabel}>카드감지</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>전체 거래 내역</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>거래 내역이 없어요</Text>
            <Text style={styles.emptySub}>CSV 업로드 또는 결제 시뮬레이션을 해보세요</Text>
          </View>
        ) : (
          transactions.slice().reverse().map((tx, i) => {
            const src = getSource(tx)
            const badge = SOURCE_LABEL[src] || SOURCE_LABEL.simulation
            return (
              <View key={tx.id || i} style={styles.txCard}>
                <View style={styles.txTop}>
                  <Text style={styles.txMerchant} numberOfLines={1}>
                    {tx.merchant_name || tx.가맹점명 || '-'}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>
                <View style={styles.txBottom}>
                  <Text style={styles.txDate}>{formatDate(tx.created_at || tx.이용일자)}</Text>
                  <Text style={styles.txAmount}>
                    {tx.amount ? `${Number(tx.amount).toLocaleString()}원` : ''}
                  </Text>
                  <Text style={styles.txCarbon}>
                    {tx.carbon_kg != null ? `${tx.carbon_kg.toFixed(3)} kg CO₂` : ''}
                  </Text>
                </View>
              </View>
            )
          })
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 16, padding: 18,
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 26 },
  userEmail: { fontSize: 15, fontWeight: '600', color: '#14532d' },
  userSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#14532d' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 3 },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 10 },
  emptyBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 28, alignItems: 'center',
  },
  emptyText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  emptySub: { fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'center' },
  txCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  txTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  txMerchant: { fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  txBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txDate: { fontSize: 11, color: '#9ca3af' },
  txAmount: { fontSize: 12, color: '#6b7280' },
  txCarbon: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  logoutBtn: {
    margin: 16, marginTop: 8, padding: 16,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#fca5a5', alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
})
