import React, { useState } from 'react';
import { Alert, Button, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createProfile } from '../api/profile';

const SUGGESTED_INTERESTS = ['technology', 'sports', 'music', 'movies', 'history', 'science'];
const LANGUAGE_OPTIONS = [
  'Portuguese',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Mandarin Chinese',
  'Arabic',
  'Hindi',
  'Russian',
  'Turkish',
  'Dutch',
  'Swedish',
  'Polish',
  'Greek',
  'Hebrew',
  'Vietnamese',
  'Thai',
  'Indonesian',
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [targetLanguage, setTargetLanguage] = useState('Portuguese');
  const [languageQuery, setLanguageQuery] = useState('');
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [interestsInput, setInterestsInput] = useState('technology,music');
  const [frequencyHours, setFrequencyHours] = useState('24');
  const filteredLanguages = LANGUAGE_OPTIONS.filter((lang) =>
    lang.toLowerCase().includes(languageQuery.trim().toLowerCase()),
  );

  const frequencyValue = Math.max(1, Number(frequencyHours) || 24);

  const adjustFrequency = (delta: number) => {
    const next = Math.max(1, frequencyValue + delta);
    setFrequencyHours(String(next));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your learning profile</Text>

      <Text style={styles.label}>Target language</Text>
      <Pressable style={styles.input} onPress={() => setLanguagePickerOpen(true)}>
        <Text>{targetLanguage}</Text>
      </Pressable>

      <Text style={styles.label}>Interests (comma-separated)</Text>
      <TextInput value={interestsInput} onChangeText={setInterestsInput} style={styles.input} />
      <Text style={styles.hint}>Try: {SUGGESTED_INTERESTS.join(', ')}</Text>

      <Text style={styles.label}>Notification frequency (hours)</Text>
      <View style={styles.frequencyRow}>
        <Pressable style={styles.stepperBtn} onPress={() => adjustFrequency(-1)}>
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <TextInput
          value={frequencyHours}
          onChangeText={(v) => setFrequencyHours(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={[styles.input, styles.frequencyInput]}
        />
        <Pressable style={styles.stepperBtn} onPress={() => adjustFrequency(1)}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>

      <Button
        title="Finish setup"
        onPress={async () => {
          const interests = interestsInput
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          const hours = Number(frequencyHours);

          if (!targetLanguage.trim() || interests.length === 0 || !Number.isFinite(hours) || hours < 1) {
            Alert.alert('Invalid setup', 'Please fill language, interests, and a valid frequency.');
            return;
          }

          try {
            await createProfile({
              targetLanguage: targetLanguage.trim(),
              interests,
              checkFrequencyHours: hours,
            });
            onComplete();
          } catch {
            Alert.alert('Could not save profile', 'Please try again.');
          }
        }}
      />

      <Modal visible={languagePickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose target language</Text>
            <TextInput
              value={languageQuery}
              onChangeText={setLanguageQuery}
              placeholder="Search language"
              style={styles.input}
            />
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.languageOption}
                  onPress={() => {
                    setTargetLanguage(item);
                    setLanguagePickerOpen(false);
                    setLanguageQuery('');
                  }}
                >
                  <Text>{item}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.hint}>No matching language.</Text>}
              style={styles.languagesList}
            />
            <Button title="Close" onPress={() => setLanguagePickerOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 48, gap: 10 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  label: { fontWeight: '600' },
  hint: { color: '#666', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  frequencyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  frequencyInput: { flex: 1, textAlign: 'center' },
  stepperBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 22, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 10,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  languagesList: { maxHeight: 320 },
  languageOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
