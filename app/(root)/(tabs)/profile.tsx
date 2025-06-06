import {
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { logout } from "@/lib/appwrite";
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

// ---------- Settings Item Component ----------
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

// ---------- Profile Screen ----------
const Profile = () => {// assembling the page itself
    const { user, refetch } = useGlobalContext();

    const handleLogout = async () => { //creating logout logic/function
        const result = await logout();
        if (result) {
            Alert.alert("Success", "Logged out successfully");
            refetch();
        } else {
            Alert.alert("Error", "Failed to logout");
        }
    };

    return ( //what u want it to show so u return
        <SafeAreaView className="h-full bg-white"> {/*first wrap everything in a safe area view*/ }
            <ScrollView //then a scroll view
                showsVerticalScrollIndicator={true}
                contentContainerClassName="pb-32 px-7"
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

                {/* First section WE CAN ADD A */}
                <View className="flex flex-col mt-10">
                    <SettingsItem icon={Salad} title="Active Buffets" />
                    <SettingsItem icon={UtensilsCrossed} title="Past Buffets" />
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
