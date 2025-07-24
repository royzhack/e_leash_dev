import React, {useEffect, useState} from 'react';
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
import Camera from '@/app/actions/camera';
import {postBuffet, supplementPhoto} from '@/app/actions/buffetActions';
import { useGlobalContext } from '@/lib/global-provider';
import locations from '@/assets/NUSLocations/locations';
import { Dropdown } from 'react-native-element-dropdown';
import geojsonData from '@/assets/NUSLocations/map.json';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';       // ADDED: navigation hook
// Appwrite SDK imports
import { Client, ID, Storage } from 'react-native-appwrite';
import {uploadfile} from "@/lib/appwrite";



// Theme colors
type Props = {};
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
    { label: '7', value: 7 }, { label: '6', value: 6 }, { label: '5', value: 5 },
    { label: '4', value: 4 }, { label: '3', value: 3 }, { label: '2', value: 2 },
    { label: '1', value: 1 }, { label: 'B1', value: -1 }, { label: 'B2', value: -2 }, { label: 'B3', value: -3 }
];

// GeoJSON helper
const locationfind = id => geojsonData.features.find(x => x.id === id);


// Time checker
function timecheck(value, timediffMins: number): boolean {
    if (!value) return false;
    const input = new Date(value);
    if (isNaN(input.getTime())) return false;
    return input.getTime() - Date.now() >= timediffMins * 60 * 1000;
}


export default function Post(props: Props) {
    const navigation = useNavigation();                     // ADDED: get navigation instance
    const user = useGlobalContext().user;
    const { control, handleSubmit, formState: { errors, isSubmitSuccessful }, reset } = useForm({
        defaultValues: {
            location: null,
            level: LEVELS[4].value,
            clearedby: new Date(),
            leftover: 0,
            additionaldetails: ''
        }
    });

    // Photo state
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [photos, setPhotos] = useState([]);
    const handlePhotoTaken = img => setPhotos(p => [...p, img]);
    const removePhoto = idx => setPhotos(p => p.filter((_, i) => i !== idx));

    // Time picker
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (isSubmitSuccessful) {
            reset(); setPhotos([]); setShowTimePicker(false); setIsCameraOpen(false);
        }
    }, [isSubmitSuccessful, reset]);

    const onSubmit = async data => {
        if (!data.location) { Alert.alert('Validation', 'Please select a location'); return; }
        if (photos.length === 0) { Alert.alert('Validation', 'Please take at least one photo'); return; }

        // Lookup coords & name
        const feature = locationfind(data.location);
        if (!feature) { Alert.alert('Validation', 'Invalid location selected'); return; }
        const coords = feature.geometry.coordinates;
        const placeName = feature.properties.name;

        const photofileID = [];
        async function postPhoto (pictures) {

            for (let i = 0; i < pictures.length; i++) {
                const id = ID.unique();
                photofileID.push(id);
                const photo = await supplementPhoto(pictures[i]);
                const result = await uploadfile(photo, id);
                console.log(result);

            }
        }

        try {
            await postPhoto(photos);
            await postBuffet(
                data.level,
                data.locationdetails,
                data.clearedby,
                data.leftover,
                data.additionaldetails,
                user?.$id,
                coords,
                placeName,
                photofileID
            );
            Alert.alert('Success', 'Buffet posted successfully.');
            navigation.navigate('index');
            // ADDED: go to Home screen
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to upload and post buffet.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <Text style={[styles.title, { color: theme.primary }]}>New Buffet</Text>
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
                                placeholder="Nearby landmarks..."
                                multiline
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Photo gallery and camera modal */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.photoScroll}>
                        {photos.map((photo, idx) => (
                            <View key={idx} style={styles.thumbnailWrapper}>
                                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                                <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(idx)}>
                                    <AntDesign name="closecircle" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addButton} onPress={() => setIsCameraOpen(true)}>
                            <AntDesign name="pluscircleo" size={36} color={theme.primary} />
                            <Text style={styles.addText}>Add Photo</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    <Modal visible={isCameraOpen} animationType="slide">
                        <Camera onPhotoTaken={handlePhotoTaken} onClose={() => setIsCameraOpen(false)} />
                    </Modal>
                </View>

                {/* Cleared By Time Picker */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Cleared By</Text>
                    <Controller
                        control={control}
                        name="clearedby"
                        rules={{ required: true, validate: value => timecheck(value, 10) || "Cannot be in less than 10 min" }}
                        render={({ field: { onChange, value } }) => (
                            <>
                                <TouchableOpacity style={styles.selector} onPress={() => setShowTimePicker(true)}>
                                    <Text style={styles.selectorText}>{value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                                {showTimePicker && <DateTimePicker value={value} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => { setShowTimePicker(false); date && onChange(date); }} />}
                            </>
                        )}
                    />
                    {errors.clearedby && <Text style={styles.errorText}>{errors.clearedby.message}</Text>}
                </View>

                {/* Leftover Slider */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeaderText}>Amount leftover</Text>
                    <Controller
                        control={control}
                        name="leftover"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.sliderContainer}>
                                <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={100} step={5} value={value} onValueChange={onChange} minimumTrackTintColor={theme.primary} />
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
                            <TextInput style={styles.textInput} placeholder="Enter notes" multiline value={value} onChangeText={onChange} />
                        )}
                    />
                </View>

                {/* Submit Button */}
                <Button title="Submit Buffet" onPress={handleSubmit(onSubmit)} color={theme.primary} />
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
        color: theme.surface,
    },
    selectorText: {
        color: theme.textPrimary,
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
        color: theme.surface,
    },
});