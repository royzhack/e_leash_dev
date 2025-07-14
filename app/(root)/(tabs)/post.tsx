import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, { useState } from 'react';
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
    Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Soup } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { AntDesign } from '@expo/vector-icons';
import Camera from '@/app/(root)/(tabs)/camera';
import { postBuffet } from '@/app/actions/postBuffet';
import { useGlobalContext } from '@/lib/global-provider';
import locations from '@/assets/NUSLocations/locations';
import { Dropdown } from 'react-native-element-dropdown';
import geojsonData from '@/assets/NUSLocations/map.json';
import * as FileSystem from 'expo-file-system';
// Appwrite SDK imports
import { Client, ID, Storage, Models } from 'appwrite';
import splashicon from "@/assets/images/splashicon.png"
// Appwrite configuration
const AppwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectID: '6837256a001912254094',
    bucketID: '685387bd00305b201702',
};

// Initialize Appwrite
const client = new Client()
    .setEndpoint(AppwriteConfig.endpoint)
    .setProject(AppwriteConfig.projectID);
const storage = new Storage(client);
const BUCKET_ID = AppwriteConfig.bucketID;

// Theme
const theme = {
    primary: '#0061FF',
    overlay: 'rgba(37,99,235,0.3)',
};

// LEVEL options
const LEVELS = [
    { label: '3', value: 3 },
    { label: '2', value: 2 },
    { label: '1', value: 1 },
    { label: 'B1', value: -1 },
    { label: 'B2', value: -2 },
];

// GeoJSON lookup
const locationfind = (id: number) =>
    geojsonData.features.find(x => x.id === id);

// Photo interface
interface RNPhoto {
    uri: string;
}

export default function Post(): JSX.Element {
    const user = useGlobalContext().user;
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<{
        location: number | null;
        level: number;
        clearedby: Date;
        leftover: number;
        additionaldetails: string;
    }>({
        defaultValues: {
            location: null,
            level: LEVELS[0].value,
            clearedby: new Date(),
            leftover: 0,
            additionaldetails: '',
        },
    });

    // Camera/Gallery state
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [photos, setPhotos] = useState<RNPhoto[]>([]);
    const handlePhotoTaken = (img: RNPhoto) => setPhotos(prev => [...prev, img]);
    const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

    const [showTimePicker, setShowTimePicker] = useState(false);

    // Upload helper
    const uploadPhotos = async (photosArr: RNPhoto[]): Promise<string[]> => {
        const uploads = photosArr.map(async photo => {
            const info = await FileSystem.getInfoAsync(photo.uri, { size: true });
            const fileForUpload = {
                uri: photo.uri,
                name: photo.uri.split('/').pop() || ID.unique(),
                type: 'image/jpg',
                size: info.size || undefined,
            }
            console.log('fileForUpload →', fileForUpload);

            const file: Models.File = await storage.createFile(
                '685387bd00305b201702',
                ID.unique(),
                fileForUpload as any,
                ['role:all'],
                []
            );
            return `${AppwriteConfig.endpoint}/storage/buckets/${file.bucketId}/files/${file.$id}/view?project=${AppwriteConfig.projectID}`;
        });
        return Promise.all(uploads);
    };

    const onSubmit = async data => {
        if (!data.location) {
            Alert.alert('Validation', 'Please select a location');
            return;
        }
        if (photos.length === 0) {
            Alert.alert('Validation', 'Please add at least one photo');
            return;
        }
        const feature = locationfind(data.location!);
        if (!feature) {
            Alert.alert('Validation', 'Invalid location selected');
            return;
        }
        const coords = feature.geometry.coordinates;
        const placeName = feature.properties.name;
        try {
            const uploadedUrls = await uploadPhotos(photos);
            await postBuffet(
                data.level,
                '',
                data.clearedby,
                data.leftover,
                data.additionaldetails,
                user?.$id,
                coords,
                placeName
            );
            Alert.alert('Success', 'Buffet posted successfully.');
            setPhotos([]);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to upload and post buffet.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <Text style={[styles.title, { color: theme.primary }]}>New Buffet</Text>
                <Soup size={24} color={theme.primary} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                {/* Photo gallery */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Photos</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        contentContainerStyle={styles.photoScroll}
                    >
                        {photos.map((photo, idx) => (
                            <View key={idx} style={styles.thumbnailWrapper}>
                                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                                <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(idx)}>
                                    <AntDesign name="closecircle" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {photos.length < 5 && (
                            <TouchableOpacity style={styles.addButton} onPress={() => setIsCameraOpen(true)}>
                                <AntDesign name="pluscircleo" size={36} color={theme.primary} />
                                <Text style={styles.addText}>Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                    <Modal visible={isCameraOpen} animationType="slide">
                        <Camera onPhotoTaken={handlePhotoTaken} onClose={() => setIsCameraOpen(false)} />
                    </Modal>
                </View>
                {/* Cleared By */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Cleared By</Text>
                    <Controller
                        control={control}
                        name="clearedby"
                        render={({ field: { onChange, value } }) => (
                            <>
                                <TouchableOpacity style={styles.selector} onPress={() => setShowTimePicker(true)}>
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
                </View>
                {/* Leftover */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>
                        Leftover Level ({photos.length}% Photos)
                    </Text>
                    <Controller
                        control={control}
                        name="leftover"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.sliderContainer}>
                                <Slider
                                    style={{ flex: 1 }}
                                    minimumValue={0}
                                    maximumValue={100}
                                    step={1}
                                    value={value}
                                    onValueChange={onChange}
                                    minimumTrackTintColor={theme.primary}
                                />
                                <Text style={styles.sliderValue}>{value}%</Text>
                            </View>
                        )}
                    />
                </View>
                {/* Details */}
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
                {/* Submit */}
                <Button title="Submit Buffet" onPress={handleSubmit(onSubmit)} color={theme.primary} />
            </ScrollView>
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
