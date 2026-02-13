import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="home" options={{ title: "Accueil",
                tabBarStyle: { display: 'none' },}}
            />
            <Tabs.Screen name="details" options={{ title: "Details",
                tabBarStyle: { display: 'none' },}}
            />
        </Tabs>
    );
}
