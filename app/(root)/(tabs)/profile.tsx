import {
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ImageSourcePropType, Modal, StyleSheet, ActivityIndicator, FlatList
} from "react-native"; //added Image Source Prop Type, but didnt use it
import {getUsersBuffets, logout} from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { Image } from "react-native";
import {
    Bell,
    Edit,
    LogOut,
    ChevronRight,
    UtensilsCrossed,
    Salad
} from "lucide-react-native";
import React, {useEffect, useState} from "react";
import {Buffet} from '../../../types'
import {red} from "react-native-reanimated/lib/typescript/Colors";


interface SettingsItemProp { //this is necessary to define the arguments of each function and their datatype
    icon: React.ElementType;
    title: string;
    onPress?: () => void;
    textStyle?: string;
    showArrow?: boolean;
}

const SettingsItem = ({ //creating the settings function itself
                          icon: Icon,
                          title,
                          onPress,
                          textStyle,
                          showArrow = true,
                      }: SettingsItemProp) => (
    <TouchableOpacity //firstly we have to wrap each element into a touchable opacity
        onPress={onPress}
        className="flex flex-row items-center justify-between py-3"
    >
        <View className="flex flex-row items-center gap-3">
            <Icon size={24} color="#333" />
            <Text
                className={`text-lg font-rubik-medium text-black-300 ${textStyle}`} //styling of the text to be displayed
            >
                {title}
            </Text> {/* the text it-self */ }
        </View>

        {showArrow && <ChevronRight size={20} color="#999" />} {/* Arrow for drop down*/}
    </TouchableOpacity>
);


const Profile = () => {// assembling the page itself
    const { user, refetch } = useGlobalContext();
    const [activeBuffetvisible, setActiveBuffetvisible] = useState(false);
    const [usersBuffets, setUsersBuffets] = useState<Buffet[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedBuffet, setExpandedBuffet] = useState<string | null>(null);

    const handleLogout = async () => { //creating logout logic/function
        const result = await logout();
        if (result) {
            Alert.alert("Success", "Logged out successfully");
            refetch();
        } else {
            Alert.alert("Error", "Failed to logout");
        }
    };

    useEffect(() => {
        (async () => {
            try {
                console.log("UserID:", userID);
                setLoading(true);
                const buffets = await getUsersBuffets(userID);
                console.log('buffets', buffets);
                setUsersBuffets(buffets);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })
        ();

    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const userID = user?.$id;

    const closeActiveBuffetModal = () => {
        setActiveBuffetvisible(false); // close the modal
        console.log("modal closed");
    };

    const openActiveBuffetModal = () => {
        setActiveBuffetvisible(true);
    }

    const levelfix = (level: number) =>
        level < 0 ? `B${-level}` : level;


    return ( //what u want it to show so u return
        <SafeAreaView className="h-full bg-white"> {/*first wrap everything in a safe area view*/ }
            <ScrollView //then a scroll view
                showsVerticalScrollIndicator={true}
                className="pb-32 px-7"
            >
                {/* Top Bar */}
                <View className="flex flex-row items-center justify-between mt-5">
                    <Text className="text-xl font-rubik-bold">Profile</Text>
                    <Bell size={20} color="#000" />
                </View>

                {/* Avatar + Name */}
                <View className="flex flex-row justify-center mt-5">
                    <View className="flex flex-col items-center relative mt-5">
                        <Image
                            source={{ uri: user?.avatar }} //grabs from user which is from useglobalcontext
                            className="size-44 relative rounded-full"
                        />
                        <TouchableOpacity className="absolute bottom-11 right-2">
                            <Edit size={36} color="#000" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-rubik-bold mt-2">
                            {user?.name}
                        </Text>
                    </View>
                </View>

                <View className="flex flex-col mt-10">
                    <SettingsItem icon={Salad} title="Active Buffets" onPress={openActiveBuffetModal}/>
                       <Modal
                        visible={activeBuffetvisible}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={closeActiveBuffetModal}
                       >
                           <View style={styles.modalOverlay}>
                               <View style={styles.modalContent}>
                                   <View className = "mt-4 py-4">
                                       <TouchableOpacity onPress={closeActiveBuffetModal} style={styles.closeButton}>
                                           <Text style={styles.closeButtonText}>X</Text>
                                       </TouchableOpacity>
                                   </View>
                                    <Text style = {styles.heading}>Currently Active Buffets</Text>
                                   <FlatList
                                       data={usersBuffets}
                                       keyExtractor={item => item.$id}
                                       contentContainerStyle={{ paddingVertical: 16 }}
                                       renderItem={({ item }) => {
                                           const isExpanded = expandedBuffet === item.$id;
                                          return (
                                               <View style={styles.card}>
                                                   <TouchableOpacity
                                                       onPress={() => setExpandedBuffet(isExpanded ? null : item.$id)}>
                                                       <Text style={styles.title}>
                                                           Level: {levelfix(item.level)}
                                                       </Text>
                                                       <Text>Leftover: {item.leftover}%</Text>
                                                       <Text>Location: {item.locationname}</Text>
                                                       <Text>Details: {item.additionaldetails || '—'}</Text>
                                                       <Text>
                                                           Cleared by:{' '}
                                                           {new Date(item.clearedby).toLocaleString('en-SG', {
                                                               dateStyle: 'medium', timeStyle: 'short',
                                                           })}
                                                       </Text>

                                                       {isExpanded && (
                                                           <View style={styles.dropdownMenu}>
                                                               <TouchableOpacity onPress={() => {/* Toggle something or perform action */
                                                               }}>
                                                                   <Text style={styles.details}>Update Buffet</Text>
                                                               </TouchableOpacity>
                                                               <TouchableOpacity onPress={() => {/* Toggle something or perform action */
                                                               }}>
                                                                   <Text style={styles.details}>Edit Buffet</Text>
                                                               </TouchableOpacity>
                                                               <TouchableOpacity onPress={() => {/* Another action */
                                                               }}>
                                                                   <Text style={styles.details}>Delete buffet</Text>
                                                               </TouchableOpacity>
                                                               {/* Add more actions as needed */}
                                                           </View>
                                                       )}
                                                   </TouchableOpacity>
                                               </View>
                                           )
                                        }
                                       }
                                   />
                               </View>
                           </View>

                       </Modal>
                    <SettingsItem icon={UtensilsCrossed} title="Past Buffets"/>

                </View>



                {/* Logout */}
                <View className="flex flex-col border-t mt-5 pt-5 border-primary-200"> {/*adds the border  */}
                    <SettingsItem
                        icon={LogOut}
                        title="Logout"
                        textStyle="text-danger"
                        showArrow={false}
                        onPress={handleLogout}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    count: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
    card: {
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    title: { fontSize: 18, fontWeight: '700' },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '75%', // Modal covers 3/4 of the screen
    },
    modalContentScroll: {
        flexGrow: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'red',
        borderRadius: 12,
        padding: 5,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginVertical: 20,
    },
    text: {
        fontSize: 16,
        marginVertical: 10,
    },
    details: {
        fontSize: 16,
        marginBottom: 20,
        color: 'red'
    },
    dropdownMenu: {
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    }
});
