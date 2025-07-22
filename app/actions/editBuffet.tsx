import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Button,
    Modal,
    Image,
    StyleSheet,
    Alert,
    Platform
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Soup } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { AntDesign } from '@expo/vector-icons';
import Camera from './camera';
import { postBuffet, supplementPhoto } from './buffetActions';

import locations from '../../assets/NUSLocations/locations';
import { Dropdown } from 'react-native-element-dropdown';
import geojsonData from '../../assets/NUSLocations/map.json';
import { Client, ID, Storage } from 'react-native-appwrite';
import * as FileSystem from 'expo-file-system';
import { updateFullBuffet, uploadfile } from '../../lib/appwrite';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { timecheck } from './timefunctions';
import Buffet from '../../types';
import Index from '../(root)/(tabs)/index';
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";



// Theme colors
const theme = {
    primary: '#0061FF',
    overlay: 'rgba(37,99,235,0.3)',
};

// Level options
const LEVELS = [
    { label: '7', value: 7 },
    { label: '6', value: 6 },
    { label: '5', value: 5 },
    { label: '4', value: 4 },
    { label: '3', value: 3 },
    { label: '2', value: 2 },
    { label: '1', value: 1 },
    { label: 'B1', value: -1 },
    { label: 'B2', value: -2 },
    { label: 'B3', value: -3 }
];

const findLevel = (level:number) => {
    for (let i = 0; i < LEVELS.length; i++) {
        if (level === LEVELS[i].value) {
            return LEVELS[i].value;
        }
    }
}

// GeoJSON helper
const locationfind = id => geojsonData.features.find(x => x.id === id);
const locationfindWithName = name => locations.find((x) => x.label === name);


export default function EditBuffet() {

    const params = useLocalSearchParams();
    const buffet = params.buffet ? JSON.parse(params.buffet) : null;

    const router = useRouter(); //to allow users to navigate back


    const { control, handleSubmit, formState: { errors, isSubmitSuccessful }, reset } = useForm({
        defaultValues: {
            location: locationfindWithName(buffet.locationname).value,
            level: findLevel(buffet.level),
            clearedby: new Date(buffet.clearedby),
            leftover: buffet.leftover,
            additionaldetails: buffet.additionaldetails,
        }
    });



    // Time picker
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (isSubmitSuccessful) {
            // Reset form fields to default values
            reset();

            // reset the other usestates
            setShowTimePicker(false);
        }
    }, [isSubmitSuccessful, reset]);

    const onSubmit = async data => {
        // Basic validation
        if (!data.location) {
            Alert.alert('Validation', 'Please select a location');
            return;
        }


        // Lookup coords & name from GeoJSON
        const feature = locationfind(data.location);
        if (!feature) {
            Alert.alert('Validation', 'Invalid location selected');
            return;
        }
        const coords = feature.geometry.coordinates;
        const placeName = feature.properties.name;



        try {
           const updatedBuffet = {level: data.level, locationdetails: data.locationdetails, clearedby: data.clearedby.toISOString(),
                leftover: data.leftover, additionaldetails: data.additionaldetails, locationname: placeName,
               locationcoordslat: coords[0], locationcoordslong: coords[1],};
            // Submit buffet post
            const result = await updateFullBuffet(updatedBuffet, buffet.$id);
            Alert.alert('Success', 'Buffet updated successfully.');
            console.log("Buffet posted", result )
            return Index();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to upload and post buffet.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <Text style={[styles.title, { color: theme.primary }]}>Edit Buffet</Text>
                <Soup size={24} color={theme.primary} />
            </View>
            <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
                {/* Location Dropdown */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Location</Text>
                    <Controller
                        control={control}
                        name="location"
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                style={styles.dropdown}
                                data={locations}
                                labelField="label"
                                valueField="value"
                                placeholder="Search location"
                                search
                                searchPlaceholder="Type to search..."
                                maxHeight={200}
                                value={value}
                                onChange={item => onChange(item.value)}
                                selectedTextStyle={{ color: theme.primary }}
                                placeholderStyle={{ color: theme.primary }}
                            />
                        )}
                    />
                    {errors.location && <Text style={styles.errorText}>Location is required.</Text>}
                </View>

                {/* Level Dropdown */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Level</Text>
                    <Controller
                        control={control}
                        name="level"
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                style={styles.dropdown}
                                data={LEVELS}
                                labelField="label"
                                valueField="value"
                                placeholder="Select level"
                                value={value}
                                onChange={item => onChange(item.value)}
                                selectedTextStyle={{ color: theme.primary }}
                                placeholderStyle={{ color: theme.primary }}
                            />
                        )}
                    />
                    {errors.level && <Text style={styles.errorText}>Level is required.</Text>}
                </View>

                {/* Location details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Location details</Text>
                    <Controller
                        control={control}
                        name="locationdetails"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.textInput}
                                placeholder="Nearby landmarks (eg. parking lots/ benches, etc)"
                                multiline
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Cleared By Time Picker */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Cleared By</Text>
                    <Controller
                        control={control}
                        name="clearedby"
                        rules = {{required: true, validate: (value) => {
                                const valid = timecheck(value, 10);
                                if (!valid) {
                                    //Alert.alert("Invalid Cleared-by Time", "Buffet cannot be cleared in less than 10 minutes");
                                    // Returning the same message lets it show as a field error too
                                    return "Buffet cannot be cleared in less than 10 minutes";
                                }
                                return true;
                            }
                        }
                        }
                        render={({ field: { onChange, value } }) => (
                            <>
                                <TouchableOpacity
                                    style={styles.selector}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.selectorText}>
                                        {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={value}
                                        mode="time"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(_, date) => {
                                            setShowTimePicker(false);
                                            date && onChange(date);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    />
                    {errors.clearedby && (
                        <Text style={styles.errorText}>{errors.clearedby.message}</Text>
                    )}
                </View>

                {/* Leftover Slider */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Amount leftover</Text>
                    <Controller
                        control={control}
                        name="leftover"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.sliderContainer}>
                                <Slider
                                    style={{ flex: 1 }}
                                    minimumValue={0}
                                    maximumValue={100}
                                    step={5}
                                    value={value}
                                    onValueChange={onChange}
                                    minimumTrackTintColor={theme.primary}
                                />
                                <Text style={styles.sliderValue}>{value}%</Text>
                            </View>
                        )}
                    />
                </View>

                {/* Additional Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Additional Details</Text>
                    <Controller
                        control={control}
                        name="additionaldetails"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter any notes"
                                multiline
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Submit Button */}
                <Button
                    title="Submit Buffet"
                    onPress={handleSubmit(onSubmit)}
                    color={theme.primary}
                />
                <Button
                    title="Go Back"
                    onPress={() => {router.back()}}
                    color={theme.primary}
                />
                <Button
                    title="Go Home"
                    onPress={() => {router.push("/")}}
                    color={theme.primary}
                />
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: theme.overlay,
        borderRadius: 8,
        overflow: 'hidden',
    },
    sectionHeaderText: {
        padding: 12,
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: theme.primary,
        color: '#fff',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: theme.primary,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: theme.overlay,
        margin: 12,
        color: theme.primary,
    },
    errorText: { color: 'red', marginHorizontal: 12, marginBottom: 8 },
    photoScroll: { alignItems: 'center', padding: 12, backgroundColor: theme.overlay },
    thumbnailWrapper: { position: 'relative', marginRight: 12 },
    thumbnail: { width: 80, height: 80, borderRadius: 6 },
    removeButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: theme.primary,
        borderRadius: 12,
        padding: 2,
    },
    addButton: {
        width: 80,
        height: 80,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.overlay,
    },
    addText: { fontSize: 10, color: theme.primary, marginTop: 4, textAlign: 'center' },
    selector: {
        borderWidth: 1,
        borderColor: theme.primary,
        borderRadius: 6,
        padding: 10,
        backgroundColor: theme.overlay,
        margin: 12,
    },
    selectorText: { color: theme.primary },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.overlay,
    },
    sliderValue: { marginLeft: 12, color: theme.primary },
    textInput: {
        borderWidth: 1,
        borderColor: theme.primary,
        borderRadius: 6,
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: theme.overlay,
        margin: 12,
        color: theme.primary,
    },
});
