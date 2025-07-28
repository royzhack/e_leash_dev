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
import locations from '../../assets/NUSLocations/locations';
import { Dropdown } from 'react-native-element-dropdown';
import geojsonData from '../../assets/NUSLocations/map.json';
import { Client, ID, Storage } from 'react-native-appwrite';
import * as FileSystem from 'expo-file-system';
import { updateFullBuffet, uploadfile } from '../../lib/appwrite';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { timecheck } from '../actions/timefunctions';
import Buffet from '../../types';
import Index from '../(root)/(tabs)';
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";



// Theme colors
const theme = {
    primary: '#0061FF',           // main action color (blue)
    secondary: '#0061FF',         // secondary accent (green)
    accent: '#0061FF',            // tertiary accent (amber)
    background: '#FFFFFF',        // light grey background
    surface: '#FFFFFF',           // card backgrounds, surfaces
    overlay: 'rgba(0,0,0,0.1)',   // translucent overlay (subtle grey)
    error: '#FF0000',             // error text and alerts
    textPrimary: '#212529',       // dark primary text
    textSecondary: '#FFFFFF',     // secondary text (muted)
    refreshTint: '#007AFF'        // pull-to-refresh indicator
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
            locationdetails: buffet.locationdetails,
            clearedby: new Date(buffet.clearedby),
            leftover: buffet.leftover,
            additionaldetails: buffet.additionaldetails,
            isHalal: buffet.isHalal,
            isVeg: buffet.isVeg,
            isBeef: buffet.isBeef,
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
            router.push("/");
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

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Dietary Restrictions</Text>

                    {/* Halal Option */}
                    <View style={styles.optionSection}>
                        <Text style={styles.optionTitle}>Halal : </Text>
                        <Controller
                            control={control}
                            name="isHalal"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.optionContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            value === true && styles.selectedButton, // Apply selectedButton style for 'Yes'
                                        ]}
                                        onPress={() => onChange(true)}
                                    >
                                        <Text style={[styles.optionButtonText, value === true && styles.selectedButtonText]}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            value === false && styles.selectedButton, // Apply selectedButton style for 'No'
                                        ]}
                                        onPress={() => onChange(false)}
                                    >
                                        <Text style={[styles.optionButtonText, value === false && styles.selectedButtonText]}>No</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                    {/* Veg Option */}
                    <View style={styles.optionSection}>
                        <Text style={styles.optionTitle}> Vegetarian : </Text>
                        <Controller
                            control={control}
                            name="isVeg"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.optionContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            value === true && styles.selectedButton, // Apply selectedButton style for 'Yes'
                                        ]}
                                        onPress={() => onChange(true)}
                                    >
                                        <Text style={[styles.optionButtonText, value === true && styles.selectedButtonText]}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            value === false && styles.selectedButton, // Apply selectedButton style for 'No'
                                        ]}
                                        onPress={() => onChange(false)}
                                    >
                                        <Text style={[styles.optionButtonText, value === false && styles.selectedButtonText]}>No</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                    <View style={styles.optionSection}>
                        <Text style={styles.optionTitle}> Contains Beef: </Text>
                        <Controller
                            control={control}
                            name="isBeef"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.optionContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            value === true && styles.selectedButton, // Apply selectedButton style for 'Yes'
                                        ]}
                                        onPress={() => onChange(true)}
                                    >
                                        <Text style={[styles.optionButtonText, value === true && styles.selectedButtonText]}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            value === false && styles.selectedButton, // Apply selectedButton style for 'No'
                                        ]}
                                        onPress={() => onChange(false)}
                                    >
                                        <Text style={[styles.optionButtonText, value === false && styles.selectedButtonText]}>No</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>

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
                <View className="pb-20">
                <Button
                    title="Submit Buffet"
                    onPress={handleSubmit(onSubmit)}
                    color={theme.primary}
                />
                </View>
                <View className="pb-20">
                <Button
                    title="Go Back"
                    onPress={() => {router.back()}}
                    color={theme.primary}
                />
                </View>
                <View className="pb-20">
                <Button
                    title="Go Home"
                    onPress={() => {router.push("/")}}
                    color={theme.primary}
                />
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F5FA' ,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.textPrimary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: theme.surface,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.primary,
    },
    sectionHeaderText: {
        padding: 12,
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: theme.primary,
        color: theme.surface,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: theme.primary,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: theme.surface,
        margin: 12,
        color: theme.surface,
    },
    errorText: {
        color: theme.error,
        marginHorizontal: 12,
        marginBottom: 8,
    },
    photoScroll: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.surface,
        color: theme.surface,
    },
    thumbnailWrapper: {
        position: 'relative',
        marginRight: 12,
        backgroundColor : theme.surface,
        color : theme.surface,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 6,
        backgroundColor : theme.primary,
    },
    removeButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: theme.secondary,
        borderRadius: 12,
        padding: 2,
    },
    addButton: {
        width: 80,
        height: 80,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
        marginRight: 12,
    },
    addText: {
        fontSize: 10,
        color: theme.accent,
        marginTop: 4,
        textAlign: 'center',
    },
    selector: {
        borderWidth: 1,
        borderColor: theme.accent,
        borderRadius: 6,
        padding: 10,
        backgroundColor: theme.surface,
        margin: 12,
        color: theme.primary,
    },
    selectorText: {
        color: theme.primary,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.surface,
        color: theme.surface,
    },
    sliderValue: {
        marginLeft: 12,
        color: theme.secondary,
    },
    textInput: {
        borderWidth: 1,
        borderColor: theme.secondary,
        borderRadius: 6,
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: theme.surface,
        margin: 12,
        color: theme.textPrimary,
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    optionSection: {
        flexDirection: 'row', // Aligns the text and buttons horizontally
        alignItems: 'center', // Centers the content vertically within the container
        marginTop: 4,
        marginLeft : 4,
    },
    optionTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    optionContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 20,
        marginRight: 10,
        borderColor: theme.primary,
        backgroundColor: 'transparent',
    },
    selectedButton: {
        backgroundColor: theme.primary,
        color: theme.surface,

    },
    selectedButtonText: {
        fontSize: 16,
        color: theme.surface,
    },
    optionButtonText: {
        fontSize: 16,
        color: '#0061FF',
    },
});