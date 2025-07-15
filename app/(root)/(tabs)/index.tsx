// app/screens/Index.tsx
import React, { useEffect, useState } from 'react'; //
import {
    Text,
    View,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import * as Location from 'expo-location';
import {getFileMini, getLatestBuffets} from '@/lib/appwrite';
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
function useUserLocation(): UserLocation | null { // function to get UserLocation object (with latitude and longitude) or null if we haven’t got location yet.
    const [location, setLocation] = useState<UserLocation | null>(null); //create a state location and set it take either User location and null <UserLocation | null> this tell you that the state can only hold these two objects , so (null) tells us that its intital value is null


    useEffect(() => {
        let subscriber: Location.LocationSubscription;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync(); //ask for permission to access location/
            if (status !== 'granted') { //if permission is denied
                console.warn('Location permission denied');
                return;
            }
            subscriber = await Location.watchPositionAsync( //start watching location and update subscriber with the location
                { accuracy: Location.Accuracy.High, distanceInterval: 5 }, //accuracy is high and distance interval is 5 meters
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

    return location; //return the state location, last position of the user
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
    //GetLocation();
    const userLocation = useUserLocation();
    const [rawBuffets, setRawBuffets] = useState<Buffet[]>([]);
    const [buffets, setBuffets] = useState<Buffet[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false); // 1. State to control modal visibility
    const [selectedBuffet, setSelectedBuffet] = useState<Buffet | null>(null); // 2. State to hold selected buffet
    const [imgUrls, setImgUrls] = useState<Record<string, string>>({});

    // 4.1 Fetch from Appwrite on mount
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const docs = await getLatestBuffets();
                setRawBuffets(docs);
                const newImgUrls: Record<string, string> = {};
                for (const buffet of docs) {
                    const fileId = buffet.photofileID[1]; // assuming 'uri' is the file ID in Appwrite
                    const url = await getFileMini(fileId); // get the mini preview URL
                    newImgUrls[buffet.$id] = url; // save the URL by the buffet ID
                }

                setImgUrls(newImgUrls);
                console.log(imgUrls)
            } catch (error) {
                console.error(error);
            } finally {
            setLoading(false);
        }

        })();
    }, []);

    // 4.2 Recompute distances whenever location or buffets change
    useEffect(() => {
        if (!userLocation || rawBuffets.length === 0) return;

        const withDistance = rawBuffets // rawBuffets hold all the  buffets after getting them
            .map(b => ({ // map each buffet to a new object with distance
                ...b,
                distance: calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    b.locationcoordslong,
                    b.locationcoordslat
                )
            }))
            .sort((a, b) => (a.distance! - b.distance!)); // sort by distance, ascending order/

        setBuffets(withDistance); // set buffets to the new value with distance computed
    }, [userLocation, rawBuffets]); // only recompute when user location or buffets change/ power of useEffect

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const levelfix = (level: number) =>
        level < 0 ? `B${-level}` : level;

    // 4.3 Open modal with selected buffet details
    const openModal = (buffet: Buffet) => {
        setSelectedBuffet(buffet); // set the selected buffet
        setModalVisible(true); // open the modal
    };

    // 4.4 Close modal
    const closeModal = () => {
        setModalVisible(false); // close the modal
        setSelectedBuffet(null); // reset the selected buffet
    };

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
                    <TouchableOpacity onPress={() => openModal(item)}>
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
                    </TouchableOpacity>
                )}
            />

            {/* Modal for displaying buffet details */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.modalContentScroll}>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>X</Text>
                            </TouchableOpacity>
                            {selectedBuffet && (
                                <>
                                    <Text style={styles.title}>Buffet Details</Text>
                                    <Text style={styles.text}>Here are the additional details of the buffet.</Text>
                                    <Text style={styles.details}>
                                        Leftover: {selectedBuffet.leftover}% {"\n"}
                                        Level: {levelfix(selectedBuffet.level)} {"\n"}
                                        Location: {selectedBuffet.locationname}
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '75%', // Modal covers 3/4 of the screen
    },
    modalContentScroll: {
        flexGrow: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'red',
        borderRadius: 15,
        padding: 10,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginVertical: 20,
    },
    text: {
        fontSize: 16,
        marginVertical: 10,
    },
    details: {
        fontSize: 18,
        marginBottom: 20,
    },
});