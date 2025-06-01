import {View, Text, TouchableOpacity, Alert} from 'react-native'
import React from 'react'
import {Link} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {logout} from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

export default function Profile() {
    const { user, refetch } = useGlobalContext(); //gets the user object and refetch function from globalprovider
    //so that u can use users info for stuff like profile pic name and all

    const handleLogout = async () => {
        const result = await logout();
        if (result) {
            console.log('Logout successful');
            Alert.alert("Success", "Logged out successfully");
            refetch(); //revalidates user (not sure what that means) and redicrecting them to sign up page
        } else {
            Alert.alert("Error", "Failed to logout");
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center",
            }}
        >
            <Link href = "/profile"> Profile</Link>
            <Link href = "/properties/1"> Properties</Link>
            <TouchableOpacity onPress={handleLogout}>
                <Text>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>

    );
}
