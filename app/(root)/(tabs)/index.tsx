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
import halal from '@/constants/images'
import * as Location from 'expo-location';
import {checkUserRating, getBuffetRating, getLatestBuffets , getUserName , postRating} from '@/lib/appwrite';
import { Buffet, UserLocation } from '../../../types';
import calculateDistance from '@/app/actions/locationfunctions';
import {Soup} from "lucide-react-native";
import RatingForm from "@/app/components/RatingForm";
//import {postRating} from "@/app/actions/ratingsActions";
import {useGlobalContext} from "@/lib/global-provider";
import {useFocusEffect} from '@react-navigation/native';
import {red} from "react-native-reanimated/lib/typescript/Colors";


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
    async function handleRatingSubmit({ rating, comment, buffetID }) {
        try {
            setLoading(true);
            {/*} const check = await checkUserRating(user?.$id, buffetID)
        if (check.length > 0) {
            Alert.alert("Cannot post another rating", "You can only post one rating per buffet");
            return;
        } */}

            // Fetch the current user's username
            const userName = await getUserName(user.$id);  // Assuming user.$id is available

            // Construct the newRating object
            const newRating = {
                rating: rating,
                comments: comment,
                buffetID: buffetID,
                userID: user.$id,   // Store the userID
                userName: userName   // Store the userName
            };

            // Submit the rating and add the userName
            await postRating(newRating);

            Alert.alert("Thank you!", 'Your rating has been posted successfully');

            // Refresh the buffet ratings after posting
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

    const averageRating = buffetRatings.length
        ? buffetRatings.reduce((acc, item) => acc + item.rating, 0) / buffetRatings.length
        : 0;



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


                            <View style={styles.progressRow}>
                                <Text style={styles.amountLabel}>Amount left :</Text>
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



                            <View style={styles.container2}>
                                {/* Display clearing text based on diffMins */}
                                {diffMins > 20 && (
                                    <Text style={[styles.clearingText, { color: theme.primary }]}>
                                        *Clearing in {diffMins} min
                                    </Text>
                                )}
                                {(diffMins > 0 && diffMins <= 20) && (
                                    <Text style={[styles.clearingText, { color: '#E53935' }]}>
                                        *Clearing in {diffMins} min
                                    </Text>
                                )}
                                {diffMins <= 0 && (
                                    <Text style={styles.clearingText}>
                                        *Cleared {Math.abs(diffMins)} min ago
                                    </Text>
                                )}

                                {/* Leaf Emoji positioned at bottom right if item.isVeg is true */}
                                {item.isVeg && (
                                    <Text style={styles.leafEmoji}>🥬</Text>
                                )}
                                {item.isHalal && (
                                    <Image
                                        source= {require('../../../assets/images/Halal.png')} // Path to the local image file
                                        style={styles.halalImage}
                                    />
                                )}
                                {!item.isBeef && (
                                    <Image
                                        source= {require('../../../assets/images/nobeef.jpg')} // Path to the local image file
                                        style={[styles.halalImage , {right: 55}]}
                                    />
                                )}

                            </View>

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
                        <Text style={[styles.modalTitle , {color: '#0061FF' } ]}>Buffet Details</Text>
                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <Text style={styles.closeX}>✕</Text>
                        </TouchableOpacity>

                        {selectedBuffet && (
                            <ScrollView contentContainerStyle={styles.modalScroll}>
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
                                        <Text style={styles.cardTitle}>
                                            {`${selectedBuffet.locationname} Level ${selectedBuffet.level}`}
                                        </Text>
                                        {selectedBuffet.distance != null && (() => {
                                            return (
                                                <Text style={styles.distanceTitle}>
                                                    | {(selectedBuffet.distance < 1000
                                                    ? `${selectedBuffet.distance} m`
                                                    : `${(selectedBuffet.distance / 1000).toFixed(1)} km`)}
                                                </Text>
                                            );
                                        })()}
                                    </View>

                                    <Text style={[styles.nearestSmallLine, {marginTop: 0} ]}>
                                        {`*${selectedBuffet.locationdetails}`}
                                    </Text>



                                    <View style={styles.progressRow}>
                                        <Text style={[styles.amountLabel  ,{fontSize: 16}]}>Amount left :</Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progress,
                                                    { width: `${selectedBuffet.leftover}%` },
                                                ]}
                                            />
                                            <Text style={[styles.progressText]}>
                                                {selectedBuffet.leftover}%
                                            </Text>
                                        </View>
                                    </View>



                                    <View style={styles.amountLabel}>
                                        <Text style={[styles.amountLabel,{marginTop : 10 , fontSize: 16}]}>Additional Details :</Text>
                                        <Text style={styles.distanceTitle}>
                                            {selectedBuffet.additionaldetails
                                                ? selectedBuffet.additionaldetails
                                                : 'No additional details provided.'}
                                        </Text>
                                    </View>
                                    <View style={styles.amountLabel}>
                                        <Text style={[styles.amountLabel, { marginTop: 10, fontSize: 16 }]}>Dietary Restrictions :</Text>

                                        <Text style={styles.distanceTitle}>
                                            {
                                                // Construct the message based on the conditions for Veg, Beef, and Halal options
                                                `${selectedBuffet.isVeg ? 'Veg options available' : ''}`
                                                + `${selectedBuffet.isBeef === false ? ', No beef' : ''}`
                                                + `${selectedBuffet.isHalal ? ', Halal' : ''}`
                                                || 'No additional details provided.'
                                            }
                                        </Text>
                                    </View>

                                    <Text style={[styles.amountLabel,{marginTop : 10 , fontSize: 16}]}>
                                        {`Cleared by :  ${new Date(
                                            selectedBuffet.clearedby
                                        ).toLocaleTimeString('en-SG', { timeStyle: 'short' })}`}
                                    </Text> {/* change to some red text later */}
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.amountLabel,{marginTop : 10 , fontSize: 16 , color: '#007AFF' , marginRight: 0 }]}>
                                             {selectedBuffet.userName}
                                        </Text>
                                        {selectedBuffet && (() => {
                                            const now = new Date();
                                            const createdAt = new Date(selectedBuffet.$createdAt);
                                            const diffMins = Math.round((now - createdAt) / 60000);
                                            return (
                                                <Text style={[styles.distanceTitle, {marginTop: 8} , {marginLeft: 3} ]}>
                                                    {`| ${diffMins} min ago`}
                                                </Text>
                                            );
                                        })()}
                                    </View>



                                    {/* Ratings section */}
                                    <View style={styles.ratingsSection}>
                                        <RatingForm
                                            buffetID={selectedBuffet.$id}
                                            onSubmit={handleRatingSubmit}
                                        />


                                        <Text style={styles.sectionHeader}>
                                            {averageRating ? `Ratings: ${averageRating.toFixed(1
                                            )} / 5` : 'No ratings yet'}
                                        </Text>

                                        {selectedBuffet && (
                                        <FlatList
                                            data={buffetRatings}
                                            refreshing={ratingsLoading}
                                            onRefresh={() => openModal(selectedBuffet)}
                                            keyExtractor={(_, idx) => idx.toString()}
                                            ListEmptyComponent={() => (
                                                <Text style={styles.noRatingsText}>
                                                    No ratings yet. Be the first to rate!
                                                </Text>
                                            )}
                                            renderItem={({ item }) => {
                                                const now = new Date();
                                                const createdAt = new Date(item.$createdAt);
                                                const diffMins2 = Math.round((now - createdAt) / 60000); // Time difference in minutes

                                                return (
                                                    <View style={styles.ratingItem}>
                                                        <View style={styles.starsContainer}>
                                                            <Text style={styles.userName}>{item.userName}</Text>
                                                            <Text style={styles.ratingStars}>
                                                                {'⭐'.repeat(item.rating)}
                                                            </Text>
                                                            <Text style={[styles.distanceTitle,{marginLeft: 3}] }>{`| ${diffMins2} min ago`}</Text>
                                                        </View>
                                                            <Text style={styles.ratingComment}>{item.comments}</Text>

                                                    </View>
                                                );
                                            }}

                                        />)}
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
    leafEmoji: {
        fontSize: 14, // Size of the emoji
        position: 'absolute', // Position it at the top right
        right: 0, // Align to the right
        top: 0, // Align to the top
        paddingTop: 4, // Add some space from the right edge if needed
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    container: { flex: 1, backgroundColor: '#F2F5FA' },
    container2: {
        flex: 1,
        position: 'relative', // Ensure that the leaf emoji can be positioned absolutely inside the container
    },
    halalImage: {
        position: 'absolute', // Positioning the image absolutely inside the container
        bottom: 1, // Position the image near the bottom
        right: 27, // Position the image near the left
        width: 20, // Adjust size of the image
        height: 20, },// Adjust size of the image
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
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    ratingStars: {
        fontSize: 20,
        marginTop : 5

    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
        marginRight : 3,
    },
    commentContainer: {
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 6,
        marginTop: 5,
    },
    ratingComment: {
        fontSize: 14,
        color: '#555'},
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0061FF',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    ratingsSection: {
        marginTop: 16,
    },
    noRatingsText: {
        fontStyle: 'italic',
        color: theme.textSecondary,
        textAlign: 'center',
        marginVertical: 12,
    },
    ratingItem: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    ratingStars: {
        fontSize: 16,
        color: '#FFD700',
    },
    ratingComment: {
        marginTop: 4,
        fontSize: 14,
        color: theme.textPrimary,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative', // To allow absolute positioning inside this container
    },

    cardTitle: { fontSize: 18, fontWeight: '700', color: '#007AFF' },
    distanceTitle: { fontSize: 14, color: '#666', marginLeft: 8 },
    nearestSmallLine: { fontSize: 14, color: '#007AFF', fontWeight: '600', marginTop: 4 },
    restricted: { marginTop: 6, color: '#E53935', fontWeight: '600' },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    amountLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginRight: 8 },
    progressBar: {
        flex: 1,
        height: 17,
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
        top: 0,
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
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
        color: '#0061FF',
        marginTop : 5,
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
        textAlign: 'center',
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
