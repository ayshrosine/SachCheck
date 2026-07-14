import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function AnalyzingScreen() {
  const router = useRouter();
  const { uri, deviceId } = useLocalSearchParams();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Uploading...');

  useEffect(() => {
    analyzeFile();
  }, []);

  const analyzeFile = async () => {
    try {
      setStatus('Uploading media...');
      setProgress(20);

      const formData = new FormData();
      formData.append('file', {
        uri: uri as string,
        type: 'video/mp4', // Would need to detect actual type
        name: 'media.mp4',
      } as any);
      formData.append('device_id', deviceId as string);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      
      setStatus('Analyzing with AI...');
      setProgress(40);

      const response = await axios.post(`${apiUrl}/api/scan`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });

      setProgress(80);
      setStatus('Processing results...');

      setTimeout(() => {
        router.replace({
          pathname: '/result',
          params: { 
            result: JSON.stringify(response.data) 
          }
        });
      }, 500);

    } catch (error) {
      console.error('Analysis error:', error);
      setStatus('Analysis failed. Please try again.');
      setProgress(0);
      
      setTimeout(() => {
        router.back();
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
        
        <Text style={styles.title}>Analyzing Media</Text>
        
        <Text style={styles.status}>{status}</Text>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        
        <Text style={styles.progressText}>{progress}%</Text>
        
        <Text style={styles.info}>
          This may take a few moments depending on file size and server load
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  spinner: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 30,
  },
  info: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});