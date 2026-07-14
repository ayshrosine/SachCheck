import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function ResultScreen() {
  const router = useRouter();
  const { result } = useLocalSearchParams();
  const [verdict, setVerdict] = React.useState<any>(null);

  React.useEffect(() => {
    if (result) {
      try {
        setVerdict(JSON.parse(result as string));
      } catch (error) {
        console.error('Error parsing result:', error);
      }
    }
  }, [result]);

  const getVerdictConfig = (verdictType: string) => {
    switch (verdictType) {
      case 'likely_real':
        return {
          color: '#4CAF50',
          icon: '✅',
          title: 'Likely Real'
        };
      case 'suspicious':
        return {
          color: '#FF9800',
          icon: '⚠️',
          title: 'Suspicious'
        };
      case 'likely_fake':
        return {
          color: '#F44336',
          icon: '🚨',
          title: 'Likely Fake'
        };
      case 'inconclusive':
        return {
          color: '#9E9E9E',
          icon: '❓',
          title: 'Inconclusive'
        };
      default:
        return {
          color: '#9E9E9E',
          icon: '❓',
          title: 'Unknown'
        };
    }
  };

  const handleFeedback = async (wasCorrect: boolean) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/feedback`, {
        scan_id: verdict.id,
        was_verdict_correct: wasCorrect
      });
      Alert.alert('Thank you!', 'Your feedback helps improve our accuracy.');
    } catch (error) {
      console.error('Feedback error:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  if (!verdict) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading result...</Text>
      </View>
    );
  }

  const config = getVerdictConfig(verdict.verdict);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { backgroundColor: config.color }]}>
          <Text style={styles.icon}>{config.icon}</Text>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.confidence}>{verdict.confidence}% Confidence</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Reasons</Text>
            {verdict.reasons && verdict.reasons.map((reason: string, index: number) => (
              <View key={index} style={styles.reasonItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.reason}>{reason}</Text>
              </View>
            ))}
          </View>

          {verdict.modality_flags && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Analysis</Text>
              {Object.entries(verdict.modality_flags).map(([key, value]) => (
                <View key={key} style={styles.flagItem}>
                  <Text style={styles.flagKey}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.flagValue}>
                    {value === true ? '⚠️' : value === false ? '✅' : '❓'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Was this correct?</Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                style={[styles.feedbackButton, styles.correctButton]}
                onPress={() => handleFeedback(true)}
              >
                <Text style={styles.feedbackButtonText}>👍 Correct</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton, styles.incorrectButton]}
                onPress={() => handleFeedback(false)}
              >
                <Text style={styles.feedbackButtonText}>👎 Incorrect</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.info}>
              Analyzed with {verdict.model_used || 'AI Model'} • {new Date(verdict.created_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  icon: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    marginRight: 10,
    color: '#666',
  },
  reason: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  flagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  flagKey: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  flagValue: {
    fontSize: 16,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedbackButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  incorrectButton: {
    backgroundColor: '#F44336',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});