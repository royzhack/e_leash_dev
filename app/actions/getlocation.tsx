import {View, Text} from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'

const Getlocation = () => {
    const [location, setLocation] = useState();

    useEffect(() => {
        const getPermissions = async () => {
            let {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log("Please grant location permission");
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
            console.log("Location:");
            console.log(currentLocation);
        };
        getPermissions();
    }, []);

    return (
        <View>
            <Text>Getlocation</Text>
        </View>
    )
}
export default Getlocation

