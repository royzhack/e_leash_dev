import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'

export default function getLocation() {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        timestamp: null,
    })

    useEffect(() => {
        const getPermissionsAndLocation = async () => {
            // 1. Request permission
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                console.log('Please grant location permission')
                return
            }

            // 2. Get raw location
            const { coords, timestamp } = await Location.getCurrentPositionAsync({})

            const { latitude, longitude } = coords

            // 3. Convert timestamp (ms since epoch) to Singapore time ISO string
            const utcDate = new Date(timestamp)
            // Singapore is UTC+8
            const sgDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)
            // toISOString() gives "YYYY-MM-DDTHH:mm:ss.sssZ", so replace Z with +08:00
            const sgIsoString = sgDate.toISOString().replace('Z', '+08:00')

            // 4. Update state
            setLocation({
                latitude,
                longitude,
                timestamp: sgIsoString,
            })

            console.log('Location (SGT):', {
                latitude,
                longitude,
                timestamp: sgIsoString,
            })
        }

        getPermissionsAndLocation()
    }, [])

}




//  Haversine formula util
export default function calculateDistance(
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






