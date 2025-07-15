
import { useEffect, useState } from "react";
import {
    Image,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    SafeAreaView
} from "react-native";
import { Link } from "expo-router";
import { getLatestBuffets, getFileMini } from "@/lib/appwrite"; // adjust path
import GetLocation from '@/app/actions/getlocation';

export default function Index() {
    GetLocation();
    const [buffets, setBuffets] = useState<Buffet[]>([]); //set buffets help to change the buffets useState and this is important as react will detect a change and rerender
    const [loading, setLoading] = useState(true);

    // 1. State to hold image URL dynamically
    const [imgUrls, setImgUrls] = useState<Record<string, string>>({});

    // 2. Fetch buffets and images
    useEffect(() => {
        async function fetchBuffets() {
            try {
                setLoading(true);
                const docs = await getLatestBuffets();
                setBuffets(docs);

                // 3. Fetch image URLs for each buffet and store in state
                const newImgUrls: Record<string, string> = {};
                for (const buffet of docs) {
                    const fileId = buffet.photofileID[1] ; // assuming 'uri' is the file ID in Appwrite
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
        }

        fetchBuffets();
    }, []);

    // 4. Check if loading and render ActivityIndicator if true
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    function levelfix(level: number) {
        return level < 0 ? "B" + level * -1 : level;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>Welcome to NUS WasteLess</Text>
            <Text style={styles.count}>
                Found {buffets.length} buffet{buffets.length === 1 ? "" : "s"}
            </Text>
            <FlatList
                data={buffets}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={{ paddingVertical: 16 }}
                renderItem={({ item }) => {
                    // 5. Get the image URL for each buffet from the state (imgUrls)
                    const imageUrl = imgUrls[item.$id]; // Access image URL specific to the current item
                    console.log(imageUrl); // Debugging the image URL

                    return (
                        <View style={styles.card}>
                            {/* Render the image only if imageUrl is available */}
                            {imageUrl ? (
                                <Image style={styles.image} source={{ uri: imageUrl }} />
                            ) : (
                                <Text>No Image Available</Text>
                            )}
                            <Text style={styles.title}>Level: {levelfix(item.level)}</Text>
                            <Text>Leftover: {item.leftover + "%"}</Text>
                            <Text>Location: {item.locationname}</Text>
                            <Text>Details: {item.additionaldetails || "—"}</Text>
                            <Text>
                                Cleared by:{" "}
                                {new Date(item.clearedby).toLocaleString("en-SG", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </Text>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );

// run a for loop, make the images appear

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    heading: { fontSize: 24, fontWeight: "800", marginBottom: 8, textAlign: "center" },
    count: { fontSize: 16, marginBottom: 12, textAlign: "center" },
    card: {
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
    },
    title: { fontSize: 18, fontWeight: "700" },
    image: {
        width: 200,   // set your desired width
        height: 200,  // set your desired height
        borderRadius: 10// optional styling
    }
});