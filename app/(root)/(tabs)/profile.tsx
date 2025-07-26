import React, { useEffect, useState, useCallback } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Image,
    Modal,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import {
    Bell,
    Edit,
    ChevronRight,
    UtensilsCrossed,
    Salad,
    LogOut,
    UserCircle2, Soup,
} from 'lucide-react-native';
import {
    getUsersBuffets,
    getUsersDeletedBuffets,
    logout,
    updateBuffet,
    deleteBuffet,
    getBuffetRating
} from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';;
import { Buffet } from '../../../types';
import {useRouter} from "expo-router";
import {useFocusEffect} from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import {getBuffetaverageRating} from "@/app/actions/buffetActions";
import { Star, StarOff } from 'lucide-react-native';

export default function Profile() {
    const { user, refetch } = useGlobalContext();
    const router = useRouter();
    const userID = user?.$id;

    const [loading, setLoading] = useState(false);
    const [usersBuffets, setUsersBuffets] = useState<Buffet[]>([]);
    const [usersDeletedBuffets, setUsersDeletedBuffets] = useState<Buffet[]>([]);
    const [userBuffetwithRatings, setUserBuffetwithRatings] = useState<Buffet[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBuffetVisible, setActiveBuffetVisible] = useState(false);
    const [deletedBuffetVisible, setDeletedBuffetVisible] = useState(false);
    const [expandedBuffet, setExpandedBuffet] = useState<string | null>(null);
    const [sliderValue, setSliderValue] = useState(0);



    // Fetch logic
    const fetchMyBuffets = useCallback(async () => {
        if (!userID) return;
        setLoading(true);
        try {
            const docs = await getUsersBuffets(userID);
            setUsersBuffets(docs);
            console.log("docs", docs);
            //next, add average ratings to the buffets
            const ratedBuffets = await Promise.all(docs.map(async x => {
                const ratings = await getBuffetaverageRating(x.$id);
                return {...x, rating: ratings};
            }
            ));
            console.log("rated", ratedBuffets);
            setUserBuffetwithRatings(ratedBuffets);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userID]);

    const fetchMyDeletedBuffets = useCallback(async () => {
        if (!userID) return;
        setLoading(true);
        try {
            const docs = await getUsersDeletedBuffets(userID);
            setUsersDeletedBuffets(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userID]);


    // Run once on mount
    useEffect(() => {
        fetchMyBuffets();
        fetchMyDeletedBuffets();
    }, [fetchMyBuffets, fetchMyDeletedBuffets]);



    // Also run on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchMyBuffets();
            fetchMyDeletedBuffets();
        }, [fetchMyBuffets, fetchMyDeletedBuffets])
    );


    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMyBuffets();
        setRefreshing(false);
    }, [fetchMyBuffets]);

    // Logout
    const handleLogout = async () => {
        const ok = await logout();
        if (ok) {
            Alert.alert('Success', 'Logged out');
            refetch();
        } else {
            Alert.alert('Error', 'Logout failed');
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <Text style={styles.title}>Profile</Text>
                <UserCircle2 size={24} color={'#0061FF'} />
            </View>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.refreshTint}
                    />
                }
            >
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                    <Image source={{ uri: user?.avatar }} style={styles.avatar} />
                    <Text style={styles.userName}>{user?.name}</Text>
                </View>

                {/* Active Buffets */}
                <TouchableOpacity
                    style={[styles.card, styles.cardRow]}
                    onPress={() => setActiveBuffetVisible(true)}
                >
                    <View style={styles.titleRow}>
                        <Salad size={20} color={theme.primary} />
                        <Text style={styles.cardTitle}>My Active Buffets</Text>
                    </View>
                    <ChevronRight size={25} color= '#0061FF' />
                </TouchableOpacity>
                {/* Past Buffets placeholder */}
                <TouchableOpacity
                    style={[styles.card, styles.cardRow]}
                    onPress={() => setDeletedBuffetVisible(true)}
                >
                    <View style={styles.titleRow}>
                        <UtensilsCrossed size={20} color={theme.primary} />
                        <Text style={styles.cardTitle}>My Past Buffets</Text>
                    </View>
                    <ChevronRight size={25} color= '#0061FF' />
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity style={styles.card} onPress={handleLogout}>
                    <View style={styles.titleRow}>
                        <LogOut size={20} color={theme.primary} />
                        <Text style={[styles.cardTitle, { color: theme.error }]}>Logout</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* Active Buffets Modal */}
            <Modal
                visible={activeBuffetVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setActiveBuffetVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setActiveBuffetVisible(false)}
                        >
                            <Text style={styles.closeX}>✕</Text>
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Your Active Buffets</Text>

                        <FlatList
                            data={userBuffetwithRatings}
                            keyExtractor={b => b.$id}
                            contentContainerStyle={{ paddingVertical: 12 }}
                            renderItem={({ item }) => {
                                const isExpanded = expandedBuffet === item.$id;
                                return (
                                    <View style={styles.card}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() =>
                                                setExpandedBuffet(isExpanded ? null : item.$id)
                                            }
                                        >
                                            {/* Buffet Info */}
                                                    <ScrollView
                                                        horizontal
                                                        showsHorizontalScrollIndicator={false}
                                                        style={styles.imageScroll}
                                                    >
                                                        {item.photofileID.map(id => (
                                                            <Image
                                                                key={id}
                                                                source={{
                                                                    uri: `https://fra.cloud.appwrite.io/v1/storage/buckets/685387bd00305b201702/files/${id}/preview?project=6837256a001912254094`,
                                                                }}
                                                                style={styles.modalImage}
                                                            />
                                                        ))}
                                                    </ScrollView>

                                            <View style={styles.titleRow}>
                                                <Text style={styles.modalcardTitle}>{item.locationname}</Text>
                                                <View style={styles.ratingWrapper}>
                                                    <Text style={styles.ratingText}>{typeof item.rating === "number" ? item.rating.toFixed(1) : "N/A"}</Text>
                                                    <Star size={18} color="#FFD700" style={styles.ratingStar} />
                                                </View>
                                            </View>

                                            <Text style={styles.nearestSmallLine}>
                                                {`*${item.locationdetails}`}
                                            </Text>


                                            <Text style={styles.amountLabel}>
                                                {`Buffet was posted at ${new Date(item.$createdAt).toLocaleString('en-SG', {
                                                    timeStyle: 'short',
                                                })}`}
                                            </Text>

                                            <Text style={styles.amountLabel}>
                                                {`Buffet will be cleared by ${new Date(item.clearedby).toLocaleString('en-SG', {
                                                    timeStyle: 'short',
                                                })}`}
                                            </Text>
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



                                            {isExpanded && (
                                                <View style={styles.dropdownMenu}>
                                                    {/* Leftover Slider */}
                                                    <View style={styles.sliderContainer}>
                                                        <Slider
                                                            style={{ flex: 1 }}
                                                            minimumValue={0}
                                                            maximumValue={100}
                                                            step={5}
                                                            value={sliderValue}
                                                            onValueChange={setSliderValue}            // update local state live…
                                                            onSlidingComplete={async (value) => {     // …and persist when they stop sliding
                                                                try {
                                                                    await updateBuffet(value, item.$id);
                                                                } catch (err) {
                                                                    console.error('Failed to update buffet:', err);
                                                                    Alert.alert('Update failed', 'Could not save new leftover amount.');
                                                                }
                                                            }}
                                                            minimumTrackTintColor={theme.primary}
                                                        />
                                                        <Text style={styles.sliderValue}>{sliderValue}%</Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            router.push({
                                                                pathname: '/components/editBuffet',
                                                                params: {
                                                                    buffet: JSON.stringify(item),
                                                                },
                                                            });
                                                            setActiveBuffetVisible(false);
                                                        }
                                                        }
                                                    >
                                                        <Text style={styles.detailText}>
                                                            Edit Buffet
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => deleteBuffet(item.$id)}
                                                    >
                                                        <Text style={[styles.detailText, { color: theme.error }]}>
                                                            Delete Buffet
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
            <Modal
                visible={deletedBuffetVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setDeletedBuffetVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setDeletedBuffetVisible(false)}
                        >
                            <Text style={styles.closeX}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Your Past Buffets</Text>
                        {/* Deleted Buffets List */}
                        <FlatList
                            data={usersDeletedBuffets}
                            keyExtractor={b => b.$id}
                            contentContainerStyle={{ paddingVertical: 12 }}
                            renderItem={({ item }) => (
                                <View style={styles.card}>
                                    {/* Buffet Info */}
                                    <Text style={styles.modalcardTitle}>{item.locationname}</Text>
                                    <Text style={styles.nearestSmallLine}>
                                        {`*${item.locationdetails}`}
                                    </Text>
                                    {/* Additional buffet details */}
                                    <Text style={styles.amountLabel}>
                                        {`Buffet was posted at ${new Date(item.$createdAt).toLocaleString('en-SG', {
                                            timeStyle: 'short',
                                        })}`}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0061FF',
    },
                                modalImage: {
                                width: 200,
                                height: 200,
                                borderRadius: 10,
                                marginRight: 10,
                                backgroundColor: '#ddd',
                            },
    nearestSmallLine: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginTop: 4 },
    container: { flex: 1, backgroundColor: '#F2F5FA' },
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

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarWrapper: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#ddd',
    },
    editAvatar: {
        position: 'absolute',
        bottom: 0,
        right: 96 / 2 - 12,
    },
    userName: {
        marginTop: 12,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0061FF',
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        paddingRight: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
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
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#007AFF', flex: 1, paddingLeft: 8 },
    modalcardTitle: { fontSize: 18, fontWeight: '700', color: '#007AFF', flex: 1},
    detailText: { fontSize: 14, color: '#212529', marginTop: 4 },
    dropdownMenu: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E5EA',
        borderWidth: 1,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sliderValue: { marginLeft: 12, color: '#0061FF', fontWeight: '600' },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '75%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        backgroundColor: theme.error,
        borderRadius: 12,
        padding: 4,
    },
    closeX: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0061FF',
        marginBottom: 16,
        textAlign: 'center',
    },
    rating: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    ratingWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    ratingStar: {
        marginRight: 4,
    },
    ratingText: {
        fontSize: 16,
        color: '#212529',
        fontWeight: '600',
    },

});
