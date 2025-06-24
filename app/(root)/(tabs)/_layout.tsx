import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, PlusSquare , UserSquare2} from 'lucide-react-native'; // import Lucide icons , can import directly from the module file

// TabIcon function takes in arguments to have a structured tab icon every time we create a new one
const TabIcon = ({
                     focused,
                     Icon,
                     title,
                 }: {
    focused: boolean;
    Icon: React.ElementType;
    title: string;
}) => (
    // Main container for the tab icon and label
    <View className="flex-1 mt-3 flex-col items-center">

        {/* Icon wrapper:
        - If focused: show a blue background with rounded corners and padding
        - If not: just apply padding to keep spacing consistent */}
        <View
            className={`${
                focused
                    ? 'bg-blue-600/30 rounded-xl px-3 py-2' // blue background when focused
                    : 'px-3 py-2'                          // same spacing when not focused
            }`}
        >
            {/* Lucide icon component:
          - Color is white when focused, gray otherwise
          - Fixed size and line thickness for consistency */}
            <Icon
                color={focused ? '#0061FF' : '#666876'} // dynamic icon color
                size={24}                             // icon size
                strokeWidth={2}                       // line thickness
            />
        </View>

        {/* Label below the icon:
        - If focused: blue and bold
        - Else: light gray and regular
        - Always centered and small font */}
        <Text
            className={`${
                focused
                    ? 'text-[#0061FF] font-rubik-medium' // label when focused
                    : 'text-black-200 font-rubik'          // label when not focused
            } text-xs w-full text-center -mt-0.4`}         // common label styling
        >
            {title}
        </Text>
    </View>
);


const TabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false, // shows the name of the file; if true it will show index, explore, profile, etc.
                tabBarStyle: {
                    backgroundColor: 'white', // sets background color of the tab bar
                    position: 'absolute', // makes the tab bar float over the content
                    borderTopColor: 'white', // color of the top border of the tab bar
                    borderTopWidth: 1, // thickness of the top border
                    minHeight: 70, // minimum height of the tab bar
                },
            }}
        >
            <Tabs.Screen
                name="index" // name of the tab you want to show; e.g., for home screen
                options={{
                    headerShown: false, // hides the top header bar
                    tabBarIcon: ({ focused }) => (
                        <TabIcon Icon={Home} focused={focused} title="Home" />
                    ),
                }}
            />

            <Tabs.Screen
                name="post" // name of the screen file (e.g., explore.tsx)
                options={{
                    title: 'Post', // title shown in the tab (not the filename)
                    headerShown: false, // hides the top header
                    tabBarIcon: ({ focused }) => (
                        <TabIcon Icon={PlusSquare} focused={focused} title="Post" />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile" // name of the screen file (e.g., explore.tsx)
                options={{
                    title: 'Profile', // title shown in the tab (not the filename)
                    headerShown: false, // hides the top header
                    tabBarIcon: ({ focused }) => (
                        <TabIcon Icon={UserSquare2} focused={focused} title="Profile" />
                    ),
                }}
            />


        </Tabs>
    );
};

export default TabsLayout;
