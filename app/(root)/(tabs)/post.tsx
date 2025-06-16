import {View, Text, ScrollView, TouchableOpacity, TextInput, Button, Platform, SafeAreaView, Modal, Image} from 'react-native'
import React, {useState} from 'react'
import {useForm, Controller} from "react-hook-form" //form saving
import {Soup} from "lucide-react-native";
import DateTimePicker from '@react-native-community/datetimepicker' //time
import {Picker} from '@react-native-picker/picker'; //location
import Slider from '@react-native-community/slider'; //leftover
import * as ImagePicker from "expo-image-picker"


const Post = () => {

    const {control,
        handleSubmit,
        formState: {
            errors
        }
    } = useForm({defaultValues: {
            clearedby: new Date()
        }});

    const submit = (data) => {
      console.log(data)
  }

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


    const takePicture = async () => {
       console.log("picture taken");
       let result = await ImagePicker.launchImageLibraryAsync({
           allowsEditing: true,
           quality:1
       })

      if (!result.canceled) {
          console.log(result);
      } else {
          alert("You did not upload any picture :)");
      }
   };


    // const handleTimeChange = (event, date, onChange) => { //this does nothing
    //     setShowTimePicker(Platform.OS === 'ios'); // Keep picker open on iOS
    //     if (date) {
    //         //setSelectedTime(date);
    //         onChange(date); // Update form state
    //     }
    // };



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
                    <Controller
                        name="buffetpics"
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <TouchableOpacity
                                onPress={async () => {
                                    let result = await ImagePicker.launchImageLibraryAsync({
                                        allowsEditing: true,
                                        quality: 1,
                                    });
                                    if (!result.canceled) {
                                        onChange(result.assets[0].uri);
                                    } else {
                                        alert("You did not upload any picture :)");
                                    }
                                }}
                                className="h-40 items-center rounded border border-gray-300 shadow-md"
                            >
                                <Text className="text-xl font-rubik-bold">Upload a picture of your buffet</Text>
                                {value && (
                                    <Image className="h-full" source={{ uri: value }} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/*location picker*/}
                <View className = 'mt-8 h-15'>
                    <Controller
                        name="location"
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                            <View style={{ height: 50, width: '100%' }}>
                                <TouchableOpacity
                                    onPress={() => setPickerVisible(true)}
                                    className="border border-gray-300 rounded p-2">
                                    <Text className="text-gray-700">
                                        {!value ? "Select location" : value}
                                    </Text>
                                </TouchableOpacity>
                                <Modal
                                    visible={isPickerVisible}
                                    transparent={true}
                                    animationType="slide"
                                    onRequestClose={() => setPickerVisible(false)}
                                >
                                    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                        <View style={{ backgroundColor: 'white', margin: 20, borderRadius: 10 }}>
                                            <Picker
                                                selectedValue={value}
                                                onValueChange={(itemValue) => {
                                                    //setSelectedLocation(itemValue);
                                                    onChange(itemValue);
                                                    setPickerVisible(false); // Hide modal after selection
                                                }}
                                                style={{ color: 'black' }} // Sets the selected value text color
                                                itemStyle={{ color: 'black' }} // Sets the dropdown item text color
                                            >
                                                <Picker.Item label="COM 2" value="COM 2" />
                                                <Picker.Item label="COM 1" value="COM 1" />
                                                <Picker.Item label="COM 3" value="COM 3" />
                                            </Picker>
                                            <Button title="Close" onPress={() => setPickerVisible(false)} />
                                        </View>
                                    </View>
                                </Modal>
                            </View>
                        )}></Controller>
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
                            name="detailslocation"
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
                            value={value, sliderState}
                            onValueChange={(value) => {
                                onChange(value);
                                setSliderState(value);
                            }
                        }
                            minimumValue={0}
                            maximumValue={100}
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
export default Post
