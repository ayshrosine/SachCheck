import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

interface Scan {
  id: string;
  modality: string;
  verdict: string;
  confidence: number;
  created_at: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { deviceId } = useLocalSearchParams();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScans();
  }, [deviceId]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/scans?device_id=${deviceId}`);
      
      setScans(response.data);
    } catch (err) {
      setError('Failed to load scan history');
      console.error('Error fetching scans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'likely_real':
        return '#4CAF50';
      case 'suspicious':
        return '#FF9800';
      case 'likely_fake':
        return '#F44336';
      case 'inconclusive':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'image':
        return '🖼️';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading scan history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchScans}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan History</Text>
        <View style={{ width: 50 }} />
      </View>

      {scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySubtext}>Upload media to see your analysis history</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {scans.map((scan) => (
            <View key={scan.id} style={styles.scanItem}>
              <View style={styles.scanHeader}>
                <Text style={styles.modalityIcon}>{getModalityIcon(scan.modality)}</Text>
                <View style={styles.scanInfo}>
                  <Text style={styles.modalityText}>{scan.modality.toUpperCase()}</Text>
                  <Text style={styles.dateText}>{formatDate(scan.created_at)}</Text>
                </View>
                <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(scan.verdict) }]}>
                  <Text style={styles.verdictText}>{scan.verdict.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={styles.scanFooter}>
                <Text style={styles.confidenceText}>{scan.confidence}% confidence</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 50,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  scanItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  modalityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  verdictText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});