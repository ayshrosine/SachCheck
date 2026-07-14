import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="analyzing" options={{ title: 'Analyzing' }} />
        <Stack.Screen name="result" options={{ title: 'Result' }} />
        <Stack.Screen name="history" options={{ title: 'History' }} />
      </Stack>
    </>
  );
}