import React, { useMemo, useState } from 'react';
import { Alert, Button, FlatList, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { getProfiles, updateProfileCheckFrequency, updateProfileInterests } from '../api/profile';
import { sendMessage, startConversation, ConversationMessage } from '../api/conversation';
import { useAuth } from '../context/AuthContext';

export function ChatScreen() {
  const { signOut } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('Portuguese');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [interestsInput, setInterestsInput] = useState('');
  const [frequencyHours, setFrequencyHours] = useState('24');
  const [busy, setBusy] = useState(false);

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
      setProfileOpen(false);
    } catch {
      Alert.alert('Save failed', 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    if (!input.trim() || busy) return;

    const text = input.trim();
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
        const updated = await sendMessage(conversationId, {
          message: text,
          targetLanguage,
        });
        setMessages(updated.messages || []);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <Button title="Profile" onPress={async () => {
          try {
            await ensureProfile();
            setProfileOpen(true);
          } catch {
            Alert.alert('No profile', 'Please complete setup first.');
          }
        }} />
      </View>

      <FlatList
        data={sortedMessages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.role}>{item.role === 'user' ? 'You' : 'Tutor'}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>Start chatting to begin your conversation.</Text>}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={styles.input}
          editable={!busy}
        />
        <Button title={busy ? '...' : 'Send'} onPress={onSend} disabled={busy} />
      </View>

      <Modal visible={profileOpen} animationType="slide" transparent onRequestClose={() => setProfileOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Profile</Text>
            <Text style={styles.label}>Target language</Text>
            <Text style={styles.readonly}>{targetLanguage}</Text>
            <Text style={styles.label}>Interests (comma-separated)</Text>
            <TextInput value={interestsInput} onChangeText={setInterestsInput} style={styles.input} editable={!busy} />
            <Text style={styles.label}>Check frequency (hours)</Text>
            <TextInput
              value={frequencyHours}
              onChangeText={setFrequencyHours}
              keyboardType="number-pad"
              style={styles.input}
              editable={!busy}
            />
            <View style={styles.modalActions}>
              <Button title="Close" onPress={() => setProfileOpen(false)} disabled={busy} />
              <Button title={busy ? 'Saving...' : 'Save'} onPress={saveProfile} disabled={busy} />
            </View>
            <View style={{ height: 8 }} />
            <Button title="Sign out" color="#b91c1c" onPress={signOut} disabled={busy} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48, paddingHorizontal: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  list: { gap: 8, paddingVertical: 8 },
  bubble: { borderRadius: 10, padding: 10 },
  userBubble: { backgroundColor: '#daf0ff', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#f2f2f2', alignSelf: 'flex-start' },
  role: { fontSize: 12, color: '#666', marginBottom: 4 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { fontWeight: '600' },
  readonly: { paddingVertical: 4, color: '#444' },
});
