import { View, Text, ScrollView, Image, TouchableOpacity , Alert} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {login} from "@/lib/appwrite";
const SignIn = () => {
    const handleLogin = async () => {
        const result = await login();
        if (result) {
            Alert.alert('Success', 'Login was successful' );
            console.log('Login successful');
        } else {
            Alert.alert("Error", "Failed to login");
        }
    };

    return (
        <SafeAreaView className="bg-white h-full">
            <ScrollView contentContainerClassName="h-full">
                <View className="px-10">
                    <Text className="text-base text-center uppercase font-rubik text-black-200">
                        Welcome to NUS WasteLess
                    </Text>

                    <Text className="text-3xl font-rubik-bold text-black-400 text-center mt-2">
                        Feeling broke today? {"\n"}
                        <Text className="text-primary-300">
                            Don't worry, we’ll find a buffet for you
                        </Text>
                    </Text>

                    <Text className="text-lg font-rubik text-black-200 text-center mt-12">
                        Login to NUS WasteLess with Google
                    </Text>

                    <TouchableOpacity onPress={handleLogin}>
                        <View className="flex flex-row items-center justify-center">
                            <Text className="text-lg font-rubik-medium text-black-400 ml-2">
                                Continue with Google
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignIn;
