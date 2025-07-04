import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Button,
    Platform,
    SafeAreaView,
    Modal,
    Image,
    StyleSheet, Alert
} from 'react-native'
import React, {useRef, useState} from 'react'
import {useForm, Controller} from "react-hook-form" //form saving
import {Soup} from "lucide-react-native";
import DateTimePicker from '@react-native-community/datetimepicker' //time
import {Picker} from '@react-native-picker/picker'; //location
import Slider from '@react-native-community/slider'; //leftover
import {postBuffet} from "@/app/actions/postBuffet";
import * as ImagePicker from "expo-image-picker"
import Camera from '@/app/(root)/(tabs)/camera'

import geojsonData from '../../../assets/NUSLocations/map.json'

import locations from "@/assets/NUSLocations/locations";
import {Dropdown} from "react-native-element-dropdown";
import { useGlobalContext } from "@/lib/global-provider";
import {CameraType, CameraView, useCameraPermissions} from "expo-camera";

const Post = () => {
    //console.log(locations);
    const user = useGlobalContext().user;
    const {control,
        handleSubmit,
        formState: {
            errors
        }
    } = useForm({defaultValues: {
            clearedby: new Date(),
            level: 1
        }});

    const locationfind = (id) => {
        return (
            geojsonData.features.find(x => x.id == id)
        );
    }

    const submit = async (data) => {
       console.log(data)

        if (!photo) {
            Alert.alert(
                "No picture taken",
                "Please take a picture of the buffet",
                [{text: 'Ok'}]
            );
            return;
        }

        const locationentered = locationfind(data.locationinput);
       console.log(locationentered.geometry.coordinates)
        console.log(locationentered.properties.name)
        try {
             const result = await postBuffet(
                 data.level,
                 data.locationdetails,
                 data.clearedby,
                 data.leftover,
                 data.additionaldetails,
                    user?.$id,
                 locationentered.geometry.coordinates,
                 locationentered.properties.name

             );
             console.log("Buffet posted:", result);
             // show a success message, reset the form, or navigate
         } catch (error) {
             console.error("Failed to post buffet:", error);
             //  show an error message to the user
         }
    };


    const [showTimePicker, setShowTimePicker] = useState(false);
  //const [selectedTime, setSelectedTime] = useState(new Date());
    // this is unnecessary as react hook form already takes care of use state

 // const [selectedLocatipn, setSelectedLocation] = useState();
  const [isPickerVisible, setPickerVisible] = useState(false);

  const [sliderState, setSliderState] = useState(0);

    const [isLevelPickerVisible, setLevelPickerVisible] = useState(false);
    const LEVELS = [
        { label: "3", value: 3 },
        { label: "2", value: 2 },
        { label: "1", value: 1 },
        { label: "B1", value: -1 },
        { label: "B2", value: -2 },
        ];
    // Helper to get label from value
   const getLevelLabel = (value) => {
       const found = LEVELS.find(l => l.value === value);
       return found ? found.label : "What floor?";
   };

   const [LocationPicker, setLocationPicker] = useState(false);
   const getLocationName = (value:any):string => {
       const found = locations.find(loc => JSON.stringify(loc.value) === JSON.stringify(value));
       return found? found.label : "Where is the buffet?";
   }

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [photo, setPhoto] = useState(null);





    return (
        <SafeAreaView className="h-full bg-white"> {/*first wrap everything in a safe area view*/ }
            <ScrollView showsVerticalScrollIndicator={true} contentContainerClassName="pb-32 px-7"> {/*scrollview*/}
                {/* Top Bar */}
                <View className="flex flex-row items-center justify-between mt-5 ">
                    <Text className="text-xl font-rubik-bold">New Buffet</Text>
                    <Soup size={30} color="#000" />
                </View>

                {/*Pictures of buffet*/}
                <View>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Buffet Photo</Text>
                    {photo ? (
                        <View>
                            <Image
                                source={{ uri: photo.uri }}
                                style={{ width: 200, height: 200, borderRadius: 8 }}
                            />
                            <Button title="Retake Photo" onPress={() => setIsCameraOpen(true)} />
                        </View>
                    ) : (
                        <Button title="Take Photo" onPress={() => setIsCameraOpen(true)} />
                    )}
                    <Modal visible={isCameraOpen} animationType="slide">
                        <Camera
                            onPhotoTaken={(img) => {
                                setPhoto(img);
                                setIsCameraOpen(false);
                                console.log("PhotoTaken", photo);
                            }}
                            onClose={() => setIsCameraOpen(false)}
                        />
                    </Modal>
                </View>


                {/*location picker*/}

                <View>
                    <Controller
                        name={"locationinput"}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <View style={{ height: 50, width: '100%' }}>
                                <TouchableOpacity
                                    onPress={() => setLocationPicker(true)}
                                    className="border border-gray-300 rounded p-2">
                                    <Text className="text-gray-700">
                                        {getLocationName(value)}
                                    </Text>
                                </TouchableOpacity>
                                <Modal
                                    visible={LocationPicker}
                                    transparent={true}
                                    animationType="slide"
                                    onRequestClose={() => setLocationPicker(false)}
                                >
                                    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                        <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 10 }}>
                                            <Picker
                                                selectedValue={value}
                                                onValueChange={(itemValue) => {
                                                    //setSelectedLocation(itemValue);
                                                    onChange(itemValue);
                                                    //setLocationPicker(false); // Hide modal after selection
                                                }}
                                                style={{ color: 'black' }} // Sets the selected value text color
                                                itemStyle={{ color: 'black' }} // Sets the dropdown item text color
                                            >
                                                {locations.map(location => (
                                                    <Picker.Item key={location.value} label={location.label} value={location.value} />
                                                ))}
                                            </Picker>
                                            <Button title="Close" onPress={() => setLocationPicker(false)} />
                                        </View>
                                    </View>
                                </Modal>
                            </View>
                        )}
                    />


                </View>


                {/*location's level picker*/}
                <View className = 'mt-8 h-15'>
                    <Controller
                        name={'level'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <View style={{ height: 50, width: '100%' }}>
                                <TouchableOpacity
                                    onPress={() => setLevelPickerVisible(true)}
                                    className="border border-gray-300 rounded p-2">
                                    <Text className="text-gray-700">
                                        {getLevelLabel(value)}
                                    </Text>
                                </TouchableOpacity>
                                <Modal
                                    visible={isLevelPickerVisible}
                                    transparent={true}
                                    animationType="slide"
                                    onRequestClose={() => setLevelPickerVisible(false)}
                                >
                                    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                        <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 10 }}>
                                            <Picker
                                                selectedValue={value}
                                                onValueChange={(itemValue) => {
                                                    //setSelectedLocation(itemValue);
                                                    onChange(itemValue);
                                                    setLevelPickerVisible(false); // Hide modal after selection
                                                }}
                                                style={{ color: 'black' }} // Sets the selected value text color
                                                itemStyle={{ color: 'black' }} // Sets the dropdown item text color
                                            >
                                                {LEVELS.map(level => (
                                                    <Picker.Item key={level.value} label={level.label} value={level.value} />
                                                ))}
                                            </Picker>
                                            <Button title="Close" onPress={() => setLevelPickerVisible(false)} />
                                        </View>
                                    </View>
                                </Modal>
                            </View>
                        )}
                    />
                </View>

                {/*additional details regarding location*/}
                <View>
                    <Text>Additional details (eg. near MPSH/drop of point)</Text>
                        <Controller
                            name="locationdetails"
                            control={control}
                            render={({field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    placeholder="Enter additional details"
                                    onBlur={onBlur}in
                                    onChangeText={onChange}
                                    value={value}
                                />
                            )}
                        />
                </View>

                {/* Time Picker */}
                <View className = 'mt-8'>
                    <Text>When will the food be cleared by/expire?</Text>
                    <Controller
                        name="clearedby"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <View>
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    className="border border-gray-300 rounded p-2">
                                    <Text className="text-gray-700">
                                        {!value ? 'Select time' : value.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </TouchableOpacity>

                                {showTimePicker && (
                                    <DateTimePicker
                                        value={value || new Date()}
                                        mode="time"
                                        display="default"
                                        onChange={(event, date) => {
                                            setShowTimePicker(false); // Hide picker after selection
                                            if (date) {
                                               // setSelectedTime(date);
                                                onChange(date);
                                            }
                                        }}
                                    />
                                )}
                            </View>
                        )}
                    />
                </View>

                {/*Leftover slider*/}
                <View>
                    <Text>Leftovers</Text>
                <Controller
                    name="leftover"
                    control = {control}
                    render={({ field: { onChange, value } }) => (
                        <View><Slider
                            className="w-0.9 h-20"
                            value={value}
                            onValueChange={(value) => {
                                onChange(Math.round(value));
                                setSliderState(value);
                            }
                        }
                            minimumValue={0}
                            maximumValue={100}
                            step={1}
                            minimumTrackTintColor="#06b6d4"
                            maximumTrackTintColor="#cbd5e1"
                        /></View>
                    )}/>
                    <Text>{Math.round(sliderState) + "%"}</Text>
                </View>

                {/*additional details general*/}
                <View>
                    <Text>Additional details</Text>
                    <Controller
                        name="additionaldetails"
                        control={control}
                        render={({field: { onChange, onBlur, value } }) => (
                            <TextInput
                                placeholder="Enter additional details"
                                onBlur={onBlur}in
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                </View>


                {/* submit button*/}
            <View className="items-centre mt-8">
                <TouchableOpacity onPress={handleSubmit(submit)} >
                    <Text className="text-black font-rubik-bold self-center">Submit</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
        marginHorizontal: 10,
        backgroundColor: 'gray',
        borderRadius: 10,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default Post

