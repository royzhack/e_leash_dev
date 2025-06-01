import {View, Text} from 'react-native'
import React from 'react'
import {Tabs} from "expo-router";

import images from '@/constants/images.ts' //change to later icons later

const TabIcon = ({ focused, icon, title}:{focused: boolean; icon: any; title: string}) => {
    <View>
        <Image source={icon}/>
        <Text>
            {title}
        </Text>
    </View>
}


const  TabsLayout = () => {
    return (
        <Tabs screenOptions={
            {tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: 'white',
                    position: 'absolute',
                    borderTopColor: '#0061FF1A',
                    borderTopWidth: 1,
                    minHeight: 70,
                }
            }
        }>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({focused}) => (
                        <TabIcon icon = {images.icon} focused={focused} title="Home" />
                    )
                }}/>
        </Tabs>
    )
}
export default  Tabs