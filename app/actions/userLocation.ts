import {UserLocation} from "@/types";
import {useEffect, useState} from "react";
import * as Location from "expo-location";

export default function useUserLocation(): UserLocation | null {
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