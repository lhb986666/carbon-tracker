// src/screens/SocialScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { listGroups, createGroup, joinGroup } from '../api/social'

export default function SocialScreen({ navigation }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    return listGroups()
      .then(setGroups)
      .catch(() => setError('그룹 목록을 불러오지 못했어요.'))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  // 탭으로 돌아올 때마다 새로고침
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const openForm = (m) => {
    setMode(m)
    setText('')
    setError('')
  }

  const handleSubmit = async () => {
    const value = text.trim()
    if (!value) return
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'create') {
        await createGroup(value)
      } else {
        await joinGroup(value)
      }
      setMode(null)
      setText('')
      await load()
    } catch (e) {
      setError(e.response?.data?.detail || (mode === 'create' ? '그룹 생성에 실패했어요.' : '그룹 참여에 실패했어요.'))
    } finally {
      setSubmitting(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 소셜</Text>
        <Text style={styles.headerSub}>친구들과 탄소 배출량을 비교해보세요</Text>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => openForm('join')}>
          <Text style={styles.ghostText}>참여하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => openForm('create')}>
          <Text style={styles.primaryText}>+ 그룹 만들기</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {mode && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            autoFocus
            value={text}
            onChangeText={(v) => setText(mode === 'join' ? v.toUpperCase() : v)}
            placeholder={mode === 'create' ? '그룹 이름 (예: 호남대 스터디팀)' : '초대 코드 (예: L1IR9I)'}
            placeholderTextColor="#9ca3af"
            autoCapitalize={mode === 'join' ? 'characters' : 'none'}
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.formCancel} onPress={() => setMode(null)}>
              <Text style={styles.ghostText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formSubmit, (submitting || !text.trim()) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting || !text.trim()}
            >
              <Text style={styles.primaryText}>
                {submitting ? '처리 중...' : mode === 'create' ? '만들기' : '참여'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>아직 참여 중인 그룹이 없어요</Text>
          <Text style={styles.emptySub}>그룹을 만들거나 초대 코드로 참여해보세요</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { groupId: g.id })}
              activeOpacity={0.7}
            >
              <View style={styles.groupIcon}>
                <Text style={{ fontSize: 18 }}>🌿</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
                  {g.is_owner && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerText}>방장</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.groupMeta}>멤버 {g.member_count}명 · 코드 {g.invite_code}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { padding: 48, alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  primaryBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ghostBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center',
  },
  ghostText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  errorBox: {
    marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#fef2f2',
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  formCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  input: {
    borderWidth: 1.5, borderColor: '#d1fae5', borderRadius: 10, padding: 12, fontSize: 14,
    backgroundColor: '#f0fdf4', color: '#14532d', marginBottom: 10,
  },
  formBtns: { flexDirection: 'row', gap: 8 },
  formCancel: {
    flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
  },
  formSubmit: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: '#16a34a', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#86efac' },
  list: { marginHorizontal: 16, gap: 10 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  groupIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#14532d', flexShrink: 1 },
  ownerBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  ownerText: { fontSize: 10, color: '#16a34a', fontWeight: '600' },
  groupMeta: { fontSize: 12, color: '#9ca3af', marginTop: 3 },
  chevron: { fontSize: 22, color: '#d1d5db' },
  emptyCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  emptySub: { fontSize: 12, color: '#9ca3af', marginTop: 6, textAlign: 'center' },
})
