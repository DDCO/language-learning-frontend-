import React, { useMemo, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { getProfiles } from '../api/profile';
import { sendMessage, startConversation, ConversationMessage } from '../api/conversation';
import { useAuth } from '../context/AuthContext';

export function ChatScreen() {
  const { signOut } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('Portuguese');
  const [profileId, setProfileId] = useState<string | null>(null);
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
    return { profileId: profiles[0].id, targetLanguage: profiles[0].targetLanguage };
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
        <Button title="Sign out" onPress={signOut} />
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
});
