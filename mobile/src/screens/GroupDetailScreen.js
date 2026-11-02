// src/screens/GroupDetailScreen.js
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Share, RefreshControl } from 'react-native'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { getGroup, getLeaderboard, leaveGroup } from '../api/social'
import { subscribeDataChanged } from '../utils/dataEvents'

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [group, setGroup] = useState(null)
  const [entries, setEntries] = useState([])
  const [view, setView] = useState('monthly') // 'monthly' | 'total'
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const reqId = useRef(0)

  const load = useCallback(() => {
    const id = ++reqId.current
    return Promise.all([getGroup(groupId), getLeaderboard(groupId, year, month)])
      .then(([g, lb]) => {
        if (id !== reqId.current) return // 더 최근 요청이 있으면 무시
        setGroup(g)
        setEntries(lb.entries || [])
        setError('')
      })
      .catch(() => {
        if (id === reqId.current) setError('그룹 정보를 불러오지 못했어요.')
      })
      .finally(() => {
        if (id === reqId.current) { setLoading(false); setRefreshing(false) }
      })
  }, [groupId, year, month])

  // 화면에 돌아올 때마다 새로고침 (결제/CSV 입력 후 탭 이동 시 최신 반영)
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  // CSV 업로드 · 결제 입력 · 카드 알림 감지 직후 즉시 새로고침
  useEffect(() => subscribeDataChanged(() => { load() }), [load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const handleShare = () => {
    if (!group) return
    Share.share({ message: `탄소발자국 추적기 '${group.name}' 그룹에 참여해요! 초대 코드: ${group.invite_code}` }).catch(() => {})
  }

  const handleLeave = () => {
    Alert.alert('그룹 나가기', `'${group?.name}' 그룹에서 나가시겠어요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup(groupId)
            navigation.goBack()
          } catch (e) {
            setError(e.response?.data?.detail || '그룹 나가기에 실패했어요.')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.centerFull}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    )
  }

  if (!group) {
    return (
      <View style={styles.centerFull}>
        <Text style={styles.errorText}>{error || '그룹을 찾을 수 없어요.'}</Text>
        <TouchableOpacity style={[styles.ghostBtn, { marginTop: 12 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.ghostText}>목록으로</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const valueOf = (e) => (view === 'monthly' ? e.monthly_carbon_kg : e.total_carbon_kg)
  const ranked = [...entries]
    .sort((a, b) => {
      const av = valueOf(a)
      const bv = valueOf(b)
      if ((av === 0) !== (bv === 0)) return av === 0 ? 1 : -1
      return av - bv
    })
    .map((e, i) => ({ ...e, displayRank: i + 1 }))

  const me = ranked.find((e) => e.is_me)
  const myValue = me ? valueOf(me) : 0

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 목록</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        <TouchableOpacity style={styles.codeChip} onPress={handleShare}>
          <Text style={styles.codeText}>초대 코드 <Text style={{ fontWeight: '700' }}>{group.invite_code}</Text>  공유 ↗</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* 내 탄소량 요약 */}
      <View style={styles.meCard}>
        <Text style={styles.meLabel}>{view === 'monthly' ? `${year}년 ${month}월 내 배출량` : '내 누적 배출량'}</Text>
        <Text style={styles.meNum}>{myValue === 0 ? '-' : myValue.toFixed(1)}</Text>
        <Text style={styles.meUnit}>kg CO₂</Text>
        {me && myValue > 0 && (
          <View style={styles.meBadge}>
            <Text style={styles.meBadgeText}>{ranked.length}명 중 {me.displayRank}위</Text>
          </View>
        )}
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, view === 'monthly' && styles.tabActive]} onPress={() => setView('monthly')}>
          <Text style={[styles.tabText, view === 'monthly' && styles.tabTextActive]}>이번 달</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, view === 'total' && styles.tabActive]} onPress={() => setView('total')}>
          <Text style={[styles.tabText, view === 'total' && styles.tabTextActive]}>전체 누적</Text>
        </TouchableOpacity>
      </View>

      {/* 리더보드 */}
      <View style={styles.board}>
        {ranked.map((e) => {
          const value = valueOf(e)
          return (
            <View key={e.user_id} style={[styles.row, e.is_me && styles.rowMe]}>
              <Text style={[styles.rank, e.displayRank <= 3 && { fontSize: 18 }]}>
                {MEDAL[e.displayRank] || e.displayRank}
              </Text>
              <Text style={[styles.nick, e.is_me && { fontWeight: '700' }]} numberOfLines={1}>
                {e.nickname}{e.is_me ? ' (나)' : ''}
              </Text>
              <Text style={[styles.value, value === 0 && { color: '#d1d5db' }]}>
                {value === 0 ? '데이터 없음' : `${value.toFixed(1)}kg`}
              </Text>
            </View>
          )
        })}
      </View>

      <Text style={styles.foot}>탄소 배출량이 적을수록 순위가 높아요 🌱</Text>
      <Text style={styles.foot2}>CSV 업로드·결제 입력·카드 알림 감지가 끝나면 바로 반영돼요</Text>

      <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
        <Text style={styles.leaveText}>그룹 나가기</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  centerFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 24 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 6 },
  backText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  codeChip: {
    alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#dcfce7',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  codeText: { fontSize: 12, color: '#16a34a' },
  errorBox: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#fef2f2' },
  errorText: { color: '#b91c1c', fontSize: 13 },
  ghostBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#d1fae5',
  },
  ghostText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  meCard: {
    marginHorizontal: 16, marginBottom: 14, padding: 22, backgroundColor: '#16a34a', borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  meLabel: { fontSize: 13, color: '#bbf7d0', marginBottom: 6 },
  meNum: { fontSize: 48, fontWeight: '800', color: '#fff' },
  meUnit: { fontSize: 15, color: '#bbf7d0', marginTop: 2 },
  meBadge: {
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
  },
  meBadgeText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  tabs: {
    flexDirection: 'row', alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#dcfce7', borderRadius: 10, padding: 4,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, color: '#6b7280' },
  tabTextActive: { color: '#16a34a', fontWeight: '600' },
  board: { marginHorizontal: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  rowMe: { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1.5 },
  rank: { width: 32, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#888' },
  nick: { flex: 1, fontSize: 14, color: '#1a1a1a', marginHorizontal: 8 },
  value: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  foot: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 16 },
  foot2: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 4 },
  leaveBtn: {
    alignSelf: 'center', marginTop: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5',
  },
  leaveText: { color: '#b91c1c', fontSize: 13, fontWeight: '500' },
})
