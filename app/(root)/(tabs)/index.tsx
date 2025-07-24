import React, {useCallback, useEffect, useState} from 'react';
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
    RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { getLatestBuffets } from '@/lib/appwrite';
import { Buffet, UserLocation } from '../../../types';
import calculateDistance from '@/app/actions/locationfunctions';
import {Soup} from "lucide-react-native";
import {useFocusEffect} from '@react-navigation/native';


export default function Index() {
    const userLocation = useUserLocation();
    const [rawBuffets, setRawBuffets] = useState<Buffet[]>([]);
    const [buffets, setBuffets] = useState<Buffet[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBuffet, setSelectedBuffet] = useState<Buffet | null>(null);
    const [refreshing, setRefreshing] = useState(false); // ← ADDED: pull-to-refresh state

    // Fetch data
    const fetchBuffets = useCallback(async () => {
        setLoading(true);
        try {
            const docs = await getLatestBuffets();
            setRawBuffets(docs);
            setBuffets(docs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBuffets();
    }, [fetchBuffets]);

    useFocusEffect(
        useCallback(() => {
            fetchBuffets();
        }, [fetchBuffets])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBuffets();
        setRefreshing(false);
    }, [fetchBuffets]);

    // Recompute distances when data or location changes
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
            let sub: Location.LocationSubscription;
            (async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('Location permission denied');
                    return;
                }
                sub = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, distanceInterval: 5 },
                    loc =>
                        setLocation({
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                        })
                );
            })();
            return () => sub?.remove();
        }, []);
        return location;
    }

    const openModal = (b: Buffet) => {
        setSelectedBuffet(b);
        setModalVisible(true);
    };

    //  Close modal

    const closeModal = () => {
        setModalVisible(false);
        setSelectedBuffet(null);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.title}>Active Buffets</Text>
                <Soup size={24} color={'#0061FF'} />
            </View>
            <FlatList
                data={buffets}
                keyExtractor={item => item.$id}
                contentContainerStyle={{ paddingVertical: 12 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#007AFF"
                    />
                }
                renderItem={({ item, index }) => {
                    const now = new Date();
                    const clearDate = new Date(item.clearedby);
                    const diffMins = Math.round((clearDate.getTime() - now.getTime()) / 60000);
                    return (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.8}
                            onPress={() => openModal(item)}
                        >
                            <View style={styles.titleRow}>
                                <Text style={styles.cardTitle}>{item.locationname}</Text>
                                {item.distance != null && (
                                    <Text style={styles.distanceTitle}>
                                        | {(item.distance / 1000).toFixed(1)} km
                                    </Text>
                                )}
                            </View>

                            {index === 0 && (
                                <Text style={styles.nearestSmallLine}>*Nearest buffet</Text>
                            )}

                            {item.restricted && (
                                <Text style={styles.restricted}>Restricted Access</Text>
                            )}

                            <View style={styles.progressRow}>
                                <Text style={styles.amountLabel}>Amount left:</Text>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progress,
                                            { width: `${item.leftover}%` },
                                        ]}
                                    />
                                    <Text style={styles.progressText}>{item.leftover}%</Text>
                                </View>
                            </View>

                            {diffMins > 0 && diffMins < 20 && (
                                <Text style={styles.clearingText}>
                                    *Clearing in {diffMins} min
                                </Text>
                            )}
                            {diffMins <= 0 && (
                                <Text style={styles.clearingText}>
                                    *Cleared {Math.abs(diffMins)} min ago
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <Text style={styles.closeX}>✕</Text>
                        </TouchableOpacity>

                        {selectedBuffet && (
                            <ScrollView contentContainerStyle={styles.modalScroll}>
                                <Text style={styles.modalTitle}>Buffet Details</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.imageScroll}
                                >
                                    {selectedBuffet.photofileID.map(id => (
                                        <Image
                                            key={id}
                                            source={{
                                                uri: `https://fra.cloud.appwrite.io/v1/storage/buckets/685387bd00305b201702/files/${id}/preview?project=6837256a001912254094`,
                                            }}
                                            style={styles.modalImage}
                                        />
                                    ))}
                                </ScrollView>

                                <View style={styles.detailsContainer}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.cardTitle}>{`${selectedBuffet.locationname} Level ${selectedBuffet.level}`}</Text>
                                        <Text style={styles.distanceTitle}>
                                            | {(selectedBuffet.distance / 1000).toFixed(1)} km
                                        </Text>
                                    </View>

                                    <Text style={styles.nearestSmallLine}>
                                        {`*${selectedBuffet.locationdetails}`}
                                    </Text>

                                    <Text style={styles.amountLabel}>
                                        {`Buffet was posted at ${new Date(selectedBuffet.$createdAt).toLocaleString('en-SG', {
                                            timeStyle: 'short',
                                        })}`}
                                    </Text>

                                    <Text style={styles.amountLabel}>
                                        {`Buffet will be cleared by ${new Date(selectedBuffet.clearedby).toLocaleString('en-SG', {
                                            timeStyle: 'short',
                                        })}`}
                                    </Text>
                                    <View style={styles.progressRow}>
                                        <Text style={styles.amountLabel}>Amount left:</Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progress,
                                                    { width: `${selectedBuffet.leftover}%` },
                                                ]}
                                            />
                                            <Text style={styles.progressText}>{selectedBuffet.leftover}%</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );}

    const theme = {
    primary: '#0061FF',           // main action color (blue)
    secondary: '#0061FF',         // secondary accent (green)
    accent: '#0061FF',            // tertiary accent (amber)
    background: '#FFFFFF',        // light grey background
    surface: '#FFFFFF',           // card backgrounds, surfaces
    overlay: 'rgba(0,0,0,0.1)',   // translucent overlay (subtle grey)
    error: '#FF0000',             // error text and alerts
    textPrimary: '#212529',       // dark primary text
    textSecondary: '#FFFFFF',     // secondary text (muted)
    refreshTint: '#007AFF'        // pull-to-refresh indicator
};
const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    container: { flex: 1, backgroundColor: '#F2F5FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0061FF',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#007AFF' },
    distanceTitle: { fontSize: 14, color: '#666', marginLeft: 8 },
    nearestSmallLine: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginTop: 4 },
    restricted: { marginTop: 6, color: '#E53935', fontWeight: '600' },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    amountLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginRight: 8 },
    progressBar: {
        flex: 1,
        height: 10,
        backgroundColor: '#E5E5EA',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    progressText: {
        position: 'absolute',
        alignSelf: 'center',
        top: -2,
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    clearingText: {
        marginTop: 8,
        fontSize: 12,
        color: '#E53935',
        fontWeight: '600',
    },
    modalText: { fontSize: 16, lineHeight: 24, color: '#333' },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '75%',                  // ← open 75% of screen
        backgroundColor: theme.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        color: theme.primary,
    },
    closeX: {
        fontSize: 20,
        color: theme.primary,
    },
    modalScroll: {
        paddingTop: 32,
        paddingBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.textPrimary,
        marginBottom: 12,
    },
    imageScroll: {
        marginBottom: 16,
    },
    modalImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#ddd',
    },
    detailsContainer: {
        paddingHorizontal: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 12,
    },
    detailText: {
        fontSize: 16,
        color: theme.textPrimary,
        marginTop: 4,
    },
    modalSlider: {
        width: '100%',
        height: 40,
        marginTop: 8,
    },
    sliderValue: {
        fontSize: 14,
        color: theme.primary,
        textAlign: 'right',
        marginBottom: 12,
    },

});
