import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ApiEnvelope, ConversationList, Profile } from '../types/api';
import { getProfiles } from '../api/profile';

export function HomeScreen() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<ConversationList['items']>([]);

  useEffect(() => {
    (async () => {
      try {
        const profiles = await getProfiles();
        const convoRes = await api.get<ApiEnvelope<ConversationList>>('/conversations?limit=20&page=1');
        setProfiles(profiles);
        setConversations(convoRes.data.data.items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profiles</Text>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.targetLanguage}</Text>
            <Text>{item.interests.join(', ')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No profiles yet.</Text>}
      />

      <Text style={styles.title}>Recent Conversations</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.topic}</Text>
            <Text>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No conversations yet.</Text>}
      />

      <Button title="Sign out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginVertical: 4 },
  cardTitle: { fontWeight: '700' },
});
