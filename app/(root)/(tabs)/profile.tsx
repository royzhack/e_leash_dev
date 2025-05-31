import {View, Text} from 'react-native'
import React from 'react'
import {Link} from "expo-router";

export default function Profile() {
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >

            <Link href = "/profile"> Profile</Link>
            <Link href = "/properties/1"> Properties</Link>
        </View>

    );
}
