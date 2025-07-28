// takes care of all the pages the user has to be authenticated to see, ie tabs and buffets (currently called properties)
import {useGlobalContext} from "@/lib/global-provider";
import {ActivityIndicator} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Redirect, Slot} from "expo-router";

//this entire page basically shows the loading animation if loading, blocks users from accessing the app's
//different tabs if they arent logged in, and if not, just let them navigate to wherever they clicked on

export default function AppLayout() {
    const {isLoggedIn, loading} = useGlobalContext();

    if (loading) { ////show them some loading thing
        return (
            <SafeAreaView className="bg-white h-full flex justify-center items-center">
                <ActivityIndicator className="text-primary-300" size="large" />
            </SafeAreaView>
        );
    }

    if (!isLoggedIn) {
        return <Redirect href="/sign-in" />;
    }
    console.log('loading', loading, 'isLoggedIn', isLoggedIn)
    return <Slot />; //this refers to the current screen we wanna show, be it profile, home etc.
}