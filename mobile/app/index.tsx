import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    initializeDeviceId();
  }, []);

  useEffect(() => {
    if (hasShareIntent && shareIntent?.files?.length) {
      // User shared a file from WhatsApp or another app
      handleIncomingShare(shareIntent.files[0].path);
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent]);

  const initializeDeviceId = async () => {
    try {
      let storedId = await AsyncStorage.getItem('sachcheck_device_id');
      if (!storedId) {
        storedId = generateDeviceId();
        await AsyncStorage.setItem('sachcheck_device_id', storedId);
      }
      setDeviceId(storedId);
    } catch (error) {
      console.error('Error initializing device ID:', error);
    }
  };

  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  };

  const handleIncomingShare = (fileUri: string) => {
    router.push({
      pathname: '/analyzing',
      params: { uri: fileUri, deviceId }
    });
  };

  const handleManualUpload = () => {
    // For manual file selection (would need a file picker library)
    alert('File picker integration pending');
  };

  const viewHistory = () => {
    router.push({
      pathname: '/history',
      params: { deviceId }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SachCheck</Text>
        <Text style={styles.subtitle}>Deepfake Detection</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔍</Text>
        </View>

        <Text style={styles.description}>
          Share suspicious videos, audio, or images from WhatsApp to check if they're real or fake
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleManualUpload}>
          <Text style={styles.primaryButtonText}>Select File Manually</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={viewHistory}>
          <Text style={styles.secondaryButtonText}>View Scan History</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: Share directly from WhatsApp for fastest analysis
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your media is auto-deleted after 48 hours
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});