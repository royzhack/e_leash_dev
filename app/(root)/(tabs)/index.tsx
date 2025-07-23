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
    Alert
} from 'react-native';
import * as Location from 'expo-location';
import {checkUserRating, getBuffetRating, getLatestBuffets} from '@/lib/appwrite';
import { Buffet, UserLocation } from '../../../types';
import calculateDistance from '@/app/actions/locationfunctions';
import {Soup} from "lucide-react-native";
import RatingForm from "@/app/components/RatingForm";
import {postRating} from "@/app/actions/ratingsActions";
import {useGlobalContext} from "@/lib/global-provider";

export default function Index() {
    const userLocation = useUserLocation();
    const [rawBuffets, setRawBuffets] = useState<Buffet[]>([]);
    const [buffets, setBuffets] = useState<Buffet[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBuffet, setSelectedBuffet] = useState<Buffet | null>(null);
    const [refreshing, setRefreshing] = useState(false); // ← ADDED: pull-to-refresh state
    const {user} = useGlobalContext()
    const [buffetRatings, setBuffetRatings] = useState([]);
    const [ratingsLoading, setRatingsLoading] = useState(false);


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

    const openModal = async (b: Buffet) => {
        setSelectedBuffet(b);
        setModalVisible(true);
        setRatingsLoading(true);
        try {
            const results = await getBuffetRating(b.$id); // make sure getBuffetRating returns a promise that resolves to your rating array
            setBuffetRatings(results);
        } catch (error) {
            setBuffetRatings([]); // fallback
        }
        setRatingsLoading(false);
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

    //ratingfunctions
    async function handleRatingSubmit({rating, comment, buffetID}) {
        const check = await checkUserRating(user?.$id, buffetID)
        if (check.length > 0) {
            Alert.alert("Cannot post another rating", "You can only post one rating per buffet");
            return;
        }
        try {
            setLoading(true);
            await postRating(
                rating,
                comment,
                buffetID,
                user.$id
            );
            Alert.alert("Thank you!", 'Your rating has been posted successfully');
            //refresh page nowww
            if (selectedBuffet) {
                setRatingsLoading(true);
                const results = await getBuffetRating(selectedBuffet.$id);
                setBuffetRatings(results);
                setRatingsLoading(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                        onRefresh={onRefresh} // ← ADDED: pull-to-refresh binding
                        tintColor="#007AFF"
                    />
                }
                renderItem={({ item, index }) => {
                    // calculate minutes until clearing
                    const now = new Date();
                    const clearDate = new Date(item.clearedby);
                    const diffMins = Math.round((clearDate.getTime() - now.getTime()) / 60000);
                    return (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.8}
                            onPress={() => openModal(item)}
                        >
                            {/* Title row with name and distance */}
                            <View style={styles.titleRow}>
                                <Text style={styles.cardTitle}>{item.locationname}</Text>
                                {item.distance != null && (
                                    <Text style={styles.distanceTitle}>
                                        | {(item.distance / 1000).toFixed(1)} km
                                    </Text>
                                )}
                            </View>

                            {/* Nearest buffet marker */}
                            {index === 0 && (
                                <Text style={styles.nearestSmallLine}>
                                    *Nearest buffet
                                </Text>
                            )}

                            {/* Restricted tag */}
                            {item.restricted && (
                                <Text style={styles.restricted}>Restricted Access</Text>
                            )}

                            {/* Amount left and progress bar */}
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

                            {/* Clearing countdown if <20 mins */}
                            {diffMins > 0 && diffMins < 20 && (
                                <Text style={styles.clearingText}>
                                    *Clearing in {diffMins} min
                                </Text>
                            )}
                            {diffMins < 0 && (
                                <Text style={styles.clearingText}>
                                    *Cleared {-1*diffMins} min ago
                                </Text>
                            )}


                        </TouchableOpacity>
                    );
                }}
            />

            {/* Buffet Details Modal */}
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
                            <FlatList
                                data={buffetRatings}
                                refreshing={ratingsLoading}
                                keyExtractor={(_, idx) => String(idx)}
                                ListHeaderComponent={
                                    <View>
                                        <Text style={styles.modalTitle}>Buffet Details</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={{ marginVertical: 12 }}
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
                                        <Text style={styles.modalText}>
                                            Location: {selectedBuffet.locationname}{'\n'}
                                            Leftover: {selectedBuffet.leftover}%{'\n'}
                                            Details: {selectedBuffet.additionaldetails || '—'}
                                        </Text>
                                        <RatingForm buffetID={selectedBuffet.$id} onSubmit={handleRatingSubmit} />
                                        <Text>Ratings</Text>
                                    </View>
                                }
                                ListEmptyComponent={
                                    <Text>
                                        No ratings yet. Be the first to rate!
                                    </Text>
                                }
                                renderItem={({ item }) => (
                                    <View>
                                        <Text>⭐ {item.rating}</Text>
                                        <Text>{item.comments}</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    closeButton: { position: 'absolute', right: 16, top: 16, zIndex: 10 },
    closeX: { fontSize: 20, color: '#333' },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalImage: { width: 200, height: 200, borderRadius: 12, marginRight: 10, backgroundColor: '#EEE' },
    modalText: { fontSize: 16, lineHeight: 24, color: '#333' },
});
