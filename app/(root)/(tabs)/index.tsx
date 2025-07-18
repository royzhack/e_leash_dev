import React, { useEffect, useState } from 'react';
import {
    Text,
    View,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import * as Location from 'expo-location';
import { getLatestBuffets } from '@/lib/appwrite';
import { Buffet, UserLocation } from '../../../types';
import calculateDistance from '@/app/actions/locationfunctions';

export default function Index() {
    const userLocation = useUserLocation();
    const [rawBuffets, setRawBuffets] = useState<Buffet[]>([]);
    const [buffets, setBuffets] = useState<Buffet[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBuffet, setSelectedBuffet] = useState<Buffet | null>(null);

    // Fetch from Appwrite on mount
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const docs = await getLatestBuffets();
                setRawBuffets(docs);
                setBuffets(docs); // Temporarily before distance is calculated
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Recompute distances
    useEffect(() => {
        if (!userLocation || rawBuffets.length === 0) return;

        const withDistance = rawBuffets
            .map((b) => ({
                ...b,
                distance: calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    b.locationcoordslong,
                    b.locationcoordslat
                ),
            }))
            .sort((a, b) => a.distance! - b.distance!);

        setBuffets(withDistance);
    }, [userLocation, rawBuffets]);

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

    const levelfix = (level: number) => (level < 0 ? `B${-level}` : level);

    const openModal = (buffet: Buffet) => {
        setSelectedBuffet(buffet);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedBuffet(null);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>Welcome to NUS WasteLess</Text>
            <Text style={styles.count}>
                Found {buffets.length} buffet{buffets.length === 1 ? '' : 's'}
            </Text>

            <FlatList
                data={buffets}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={{ paddingVertical: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openModal(item)}>
                        <View style={styles.card}>
                            <Text style={styles.title}>Level: {levelfix(item.level)}</Text>
                            <Text>Leftover: {item.leftover}%</Text>
                            <Text>Location: {item.locationname}</Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {item.photofileID.map((id) => (
                                    <Image
                                        key={id}
                                        source={{
                                            uri: `https://fra.cloud.appwrite.io/v1/storage/buckets/685387bd00305b201702/files/${id}/preview?project=6837256a001912254094`,
                                        }}
                                        style={styles.image}
                                    />
                                ))}
                            </ScrollView>

                            <Text>Details: {item.additionaldetails || '—'}</Text>
                            <Text>
                                Cleared by:{' '}
                                {new Date(item.clearedby).toLocaleString('en-SG', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })}
                            </Text>
                            <Text>Photo File IDs: {item.photofileID.join(', ')}</Text>
                            {item.distance != null && (
                                <Text>Distance: {item.distance.toFixed(0)} m</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Buffet Details Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.modalContentScroll}>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>X</Text>
                            </TouchableOpacity>

                            {selectedBuffet && (
                                <>
                                    <Text style={styles.title}>Buffet Details</Text>

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                        {selectedBuffet.photofileID.map((id) => (
                                            <Image
                                                key={id}
                                                source={{
                                                    uri: `https://fra.cloud.appwrite.io/v1/storage/buckets/685387bd00305b201702/files/${id}/preview?project=6837256a001912254094`,
                                                }}
                                                style={styles.image}
                                            />
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.details}>
                                        Leftover: {selectedBuffet.leftover}%{'\n'}
                                        Level: {levelfix(selectedBuffet.level)}{'\n'}
                                        Location: {selectedBuffet.locationname}{'\n'}
                                        Details: {selectedBuffet.additionaldetails || '—'}
                                    </Text>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    count: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
    card: {
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    imageScroll: { marginVertical: 10 },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#ddd',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    modalContentScroll: { flexGrow: 1 },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ff5b5b',
        borderRadius: 15,
        padding: 10,
        zIndex: 10,
    },
    closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    details: { fontSize: 16, lineHeight: 24, marginTop: 12 },
});
