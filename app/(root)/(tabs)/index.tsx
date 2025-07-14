// app/screens/Index.tsx
import React, { useEffect, useState } from 'react';
import {
    Text,
    View,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    StyleSheet
} from 'react-native';
import * as Location from 'expo-location';
import { getLatestBuffets } from '@/lib/appwrite';
import GetLocation from '@/app/actions/getlocation';
// --- 1. Types ---
export interface Buffet {
    $id: string;
    $createdAt: string;
    clearedby: Date;
    leftover: number;
    additionaldetails: string;
    level: number;
    locationdetails: string;
    locationname: string;
    userID: string;
    locationcoordslat: number;
    locationcoordslong: number;

    /** computed on-the-fly */
    distance?: number;
}

type UserLocation = {
    latitude: number;
    longitude: number;
};

// --- 2. Hook to watch user location ---
function useUserLocation(): UserLocation | null {
    const [location, setLocation] = useState<UserLocation | null>(null);

    useEffect(() => {
        let subscriber: Location.LocationSubscription;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission denied');
                return;
            }
            subscriber = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 5 },
                (loc) => {
                    setLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    });
                }
            );
        })();

        return () => subscriber?.remove();
    }, []);

    return location;
}

// --- 3. Haversine formula util ---
function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6_371_000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- 4. Main screen ---
export default function Index() {
    GetLocation();
    const userLocation = useUserLocation();
    const [rawBuffets, setRawBuffets] = useState<Buffet[]>([]);
    const [buffets, setBuffets] = useState<Buffet[]>([]);
    const [loading, setLoading] = useState(true);

    // 4.1 Fetch from Appwrite on mount
    useEffect(() => {
        (async () => {
            setLoading(true);
            const docs = await getLatestBuffets();
            setRawBuffets(docs);
            setLoading(false);
        })();
    }, []);

    // 4.2 Recompute distances whenever location or buffets change
    useEffect(() => {
        if (!userLocation || rawBuffets.length === 0) return;

        const withDistance = rawBuffets
            .map(b => ({
                ...b,
                distance: calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    b.locationcoordslong,
                    b.locationcoordslat
                )
            }))
            .sort((a, b) => (a.distance! - b.distance!));

        setBuffets(withDistance);
    }, [userLocation, rawBuffets]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const levelfix = (level: number) =>
        level < 0 ? `B${-level}` : level;

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>Welcome to NUS WasteLess</Text>
            <Text style={styles.count}>
                Found {buffets.length} buffet{buffets.length === 1 ? '' : 's'}
            </Text>

            <FlatList
                data={buffets}
                keyExtractor={item => item.$id}
                contentContainerStyle={{ paddingVertical: 16 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.title}>
                            Level: {levelfix(item.level)}
                        </Text>
                        <Text>Leftover: {item.leftover}%</Text>
                        <Text>Location: {item.locationname}</Text>
                        <Text>Details: {item.additionaldetails || '—'}</Text>
                        <Text>
                            Cleared by:{' '}
                            {new Date(item.clearedby).toLocaleString('en-SG', {
                                dateStyle: 'medium', timeStyle: 'short',
                            })}
                        </Text>
                        {item.distance != null && (
                            <Text>
                                Distance: {item.distance.toFixed(0)} m
                            </Text>
                        )}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

// --- 5. Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    count: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
    card: {
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    title: { fontSize: 18, fontWeight: '700' },
});
