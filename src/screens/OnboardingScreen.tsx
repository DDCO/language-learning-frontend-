import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { createProfile } from '../api/profile';

const SUGGESTED_INTERESTS = ['technology', 'sports', 'music', 'movies', 'history', 'science'];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [targetLanguage, setTargetLanguage] = useState('Portuguese');
  const [interestsInput, setInterestsInput] = useState('technology,music');
  const [frequencyHours, setFrequencyHours] = useState('24');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your learning profile</Text>

      <Text style={styles.label}>Target language</Text>
      <TextInput value={targetLanguage} onChangeText={setTargetLanguage} style={styles.input} />

      <Text style={styles.label}>Interests (comma-separated)</Text>
      <TextInput value={interestsInput} onChangeText={setInterestsInput} style={styles.input} />
      <Text style={styles.hint}>Try: {SUGGESTED_INTERESTS.join(', ')}</Text>

      <Text style={styles.label}>Notification frequency (hours)</Text>
      <TextInput
        value={frequencyHours}
        onChangeText={setFrequencyHours}
        keyboardType="number-pad"
        style={styles.input}
      />

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
});
