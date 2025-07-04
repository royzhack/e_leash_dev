import { useEffect, useState } from "react";
import {
    Text,
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet, ScrollView, SafeAreaView
} from "react-native";
import { Link } from "expo-router";
import { getLatestBuffets } from "@/lib/appwrite"; // adjust path


export default function Index() {

    const [buffets, setBuffets] = useState<Buffet[]>([]); //set buffets help to change the buffets useState and this is important as react will detect a change and rerender
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBuffets() {
            setLoading(true);
            const docs = await getLatestBuffets();
            //console.log("🔥 getLatestBuffets returned:", docs);
            //console.log("#################",buffets);
            setBuffets(docs);
            setLoading(false);
        }
        fetchBuffets();

    }, []);
    //from here on wards the state of buffets change , menaing the data it holds changes as we have parsed docs nto setBuffets
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    function levelfix(level:number) {
        return (level < 0 ? "B" + level*-1 : level);
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
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.title}>Level: {levelfix(item.level)}</Text>
                        <Text>Leftover: {item.leftover + "%"}</Text>
                        <Text>Location: {item.locationname}</Text>
                        <Text>
                            Details: {item.additionaldetails || "—"}
                        </Text>
                        <Text>
                            Cleared by:{" "}
                            {new Date(item.clearedby).toLocaleString("en-SG", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}
                        </Text>
                    </View>
                )}
            />

            {/*<View style={styles.links}>*/}
            {/*    <Link href="/sign-in" style={styles.linkText}>*/}
            {/*        Sign In*/}
            {/*    </Link>*/}
            {/*    <Link href="/post" style={styles.linkText}>*/}
            {/*        Explore*/}
            {/*    </Link>*/}
            {/*    <Link href="/profile" style={styles.linkText}>*/}
            {/*        Profile*/}
            {/*    </Link>*/}
            {/*    <Link href="/properties/1" style={styles.linkText}>*/}
            {/*        Properties*/}
            {/*    </Link>*/}
            {/*    <Link href="/cameraPost" style={styles.linkText}>*/}
            {/*        Camera*/}
            {/*    </Link>*/}
            {/*</View>*/}

        </SafeAreaView>
    );

}

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
    links: { marginTop: 20, alignItems: "center" },
    linkText: { marginVertical: 4, fontSize: 16, color: "#0066cc" },
});
