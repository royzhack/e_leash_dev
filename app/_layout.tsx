import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from 'expo-splash-screen';
import { View, Text } from 'react-native';
import "./globals.css";

import GlobalProvider from "@/lib/global-provider";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load fonts, make any API calls you need to do here
                // Check authentication status
                // Initialize your GlobalProvider data

                // Simulate loading time - remove this in production
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (e) {
                console.warn(e);
            } finally {
                // Tell the application to render
                setAppIsReady(true);
                await SplashScreen.hideAsync();
            }
        }

        prepare();
    }, []);

    if (!appIsReady) {
        // You can return a custom loading screen here if needed
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <GlobalProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </GlobalProvider>
    );
}
