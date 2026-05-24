import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Button,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfiles, updateProfileCheckFrequency, updateProfileInterests } from '../api/profile';
import { getConversations, sendMessage, startConversation, ConversationMessage } from '../api/conversation';
import { useAuth } from '../context/AuthContext';

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('Portuguese');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'menu' | 'edit'>('menu');
  const [interestsInput, setInterestsInput] = useState('');
  const [frequencyHours, setFrequencyHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const [slideX] = useState(new Animated.Value(320));
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [composerHeight, setComposerHeight] = useState(72);
  const [composerBottom] = useState(new Animated.Value(12));

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const rawKeyboardHeight = e.endCoordinates?.height || 0;
      const keyboardTopY = e.endCoordinates?.screenY ?? Dimensions.get('screen').height;
      const coveredByKeyboard = Math.max(0, Dimensions.get('screen').height - keyboardTopY);
      const effectiveKeyboardHeight = Math.max(rawKeyboardHeight, coveredByKeyboard);
      setKeyboardHeight(effectiveKeyboardHeight);
      const targetBottom = effectiveKeyboardHeight + (Platform.OS === 'android' ? 6 : 8);
      Animated.timing(composerBottom, {
        toValue: targetBottom,
        duration: Platform.OS === 'ios' ? 220 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      Animated.timing(composerBottom, {
        toValue: insets.bottom + 8,
        duration: Platform.OS === 'ios' ? 220 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [composerBottom, insets.bottom]);

  React.useEffect(() => {
    const loadLatestConversation = async () => {
      try {
        const profiles = await getProfiles();
        if (profiles.length) {
          setProfileId(profiles[0].id);
          setTargetLanguage(profiles[0].targetLanguage);
          setInterestsInput((profiles[0].interests || []).join(','));
          setFrequencyHours(String(profiles[0].checkFrequencyHours || 24));
        }

        const response = await getConversations({ page: 1, limit: 1 });
        const latest = response.items?.[0];
        if (latest) {
          setConversationId(latest.id);
          setMessages(latest.messages || []);
        }
      } catch {
        // no-op: allow empty chat for first-time users
      }
    };

    loadLatestConversation();
  }, []);

  const openSidebar = async () => {
    try {
      await ensureProfile();
      setSidebarView('menu');
      setSidebarOpen(true);
      Animated.timing(slideX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } catch {
      Alert.alert('No profile', 'Please complete setup first.');
    }
  };

  const closeSidebar = () => {
    Animated.timing(slideX, {
      toValue: 320,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSidebarOpen(false);
    });
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [messages],
  );

  const ensureProfile = async () => {
    if (profileId) return { profileId, targetLanguage };
    const profiles = await getProfiles();
    if (!profiles.length) throw new Error('No profile found');
    setProfileId(profiles[0].id);
    setTargetLanguage(profiles[0].targetLanguage);
    setInterestsInput((profiles[0].interests || []).join(','));
    setFrequencyHours(String(profiles[0].checkFrequencyHours || 24));
    return { profileId: profiles[0].id, targetLanguage: profiles[0].targetLanguage };
  };

  const saveProfile = async () => {
    const p = await ensureProfile();
    const interests = interestsInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const hours = Number(frequencyHours);

    if (!interests.length || !Number.isFinite(hours) || hours < 1) {
      Alert.alert('Invalid profile', 'Please provide interests and a valid frequency.');
      return;
    }

    setBusy(true);
    try {
      await updateProfileInterests(p.profileId, interests);
      await updateProfileCheckFrequency(p.profileId, hours);
      setSidebarView('menu');
    } catch {
      Alert.alert('Save failed', 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    if (!input.trim() || busy) return;

    const text = input.trim();
    const optimisticMessage: ConversationMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput('');
    setBusy(true);

    try {
      const p = await ensureProfile();

      if (!conversationId) {
        const started = await startConversation({
          profileId: p.profileId,
          topic: text,
        });

        const updated = await sendMessage(started.id, {
          message: text,
          targetLanguage: p.targetLanguage,
        });

        setConversationId(updated.id);
        setMessages(updated.messages || []);
      } else {
        try {
          const updated = await sendMessage(conversationId, {
            message: text,
            targetLanguage,
          });
          setMessages(updated.messages || []);
        } catch (sendErr: any) {
          const status = sendErr?.response?.status;
          if (status === 404) {
            const restarted = await startConversation({
              profileId: p.profileId,
              topic: text,
            });
            const updated = await sendMessage(restarted.id, {
              message: text,
              targetLanguage: p.targetLanguage,
            });
            setConversationId(updated.id);
            setMessages(updated.messages || []);
          } else {
            throw sendErr;
          }
        }
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.error)
          ? error.response.data.error.join(', ')
          : error?.response?.data?.error) ||
        error?.message ||
        'Message failed to send. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Send failed: ${backendMessage}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <TouchableOpacity style={styles.avatarButton} onPress={openSidebar}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>👤</Text></View>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.messagesList}
        data={sortedMessages}
        keyExtractor={(_, i) => String(i)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              composerHeight +
              (keyboardHeight > 0
                ? keyboardHeight + (Platform.OS === 'android' ? 20 : 24)
                : insets.bottom + 16),
          },
        ]}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.role}>{item.role === 'user' ? 'You' : 'Tutor'}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>Start chatting to begin your conversation.</Text>}
      />

      <Animated.View
        onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
        style={[
          styles.inputRow,
          { bottom: composerBottom },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#111"
          style={styles.input}
          editable={!busy}
        />
        <Button title={busy ? '...' : 'Send'} onPress={onSend} disabled={busy} />
      </Animated.View>

      {sidebarOpen && <Pressable style={styles.overlay} onPress={closeSidebar} />}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideX }] }]}> 
        {sidebarView === 'menu' ? (
          <View style={styles.sidebarContent}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>👤</Text></View>
              <View>
                <Text style={styles.sidebarTitle}>Your profile</Text>
                <Text style={styles.subtle}>{targetLanguage} learner</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.menuCard} onPress={() => setSidebarView('edit')}>
              <Text style={styles.menuTitle}>Edit profile</Text>
              <Text style={styles.subtle}>Interests and refresh frequency</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuCard, styles.logoutCard]} onPress={signOut} disabled={busy}>
              <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
              <Text style={styles.subtle}>Sign out of this account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sidebarContent}>
            <Text style={styles.sidebarTitle}>Edit profile</Text>
            <Text style={styles.label}>Target language</Text>
            <Text style={styles.readonly}>{targetLanguage}</Text>
            <Text style={styles.label}>Interests (comma-separated)</Text>
            <TextInput value={interestsInput} onChangeText={setInterestsInput} style={styles.settingsInput} editable={!busy} />
            <Text style={styles.label}>Check frequency (hours)</Text>
            <TextInput
              value={frequencyHours}
              onChangeText={setFrequencyHours}
              keyboardType="number-pad"
              style={styles.settingsInput}
              editable={!busy}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSidebarView('menu')} disabled={busy}>
                <Text>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={saveProfile} disabled={busy}>
                <Text style={styles.primaryBtnText}>{busy ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48, paddingHorizontal: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  avatarButton: { padding: 4 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18 },
  title: { fontSize: 24, fontWeight: '700' },
  list: { gap: 8, paddingVertical: 8 },
  messagesList: { flex: 1 },
  bubble: { borderRadius: 10, padding: 10 },
  userBubble: { backgroundColor: '#daf0ff', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#f2f2f2', alignSelf: 'flex-start' },
  role: { fontSize: 12, color: '#666', marginBottom: 4 },
  inputRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 8,
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 300,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    paddingTop: 56,
    paddingHorizontal: 12,
  },
  sidebarContent: { gap: 10 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatarLarge: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { fontSize: 24 },
  sidebarTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtle: { color: '#6b7280' },
  menuCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fafafa' },
  menuTitle: { fontWeight: '700', marginBottom: 2 },
  logoutCard: { borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  logoutText: { color: '#b91c1c' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { fontWeight: '600' },
  readonly: { paddingVertical: 4, color: '#444' },
  settingsInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  secondaryBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  primaryBtn: { backgroundColor: '#111827', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
