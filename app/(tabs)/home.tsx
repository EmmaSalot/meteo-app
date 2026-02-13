import React, {useCallback, useState} from "react";
import {View, Text, StyleSheet, FlatList, Pressable} from "react-native";
import {router, useFocusEffect, useRouter} from "expo-router";
import SearchBar from "../components/searchBar";
import {Favorite, getFavorites} from "@/services/favorites";

type City = { id: string; name: string; country?: string; temp?: string };

export default function Home() {
    const router = useRouter();

    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const loadFavs = useCallback(async () => {
        const f = await getFavorites();
        setFavorites(f);
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadFavs();
        }, [loadFavs])
    );

    function onSelectFromSearch({name, latitude, longitude}: { name: string; latitude: number; longitude: number; }) {
        router.push({
            pathname: "/details",
            params: {name, latitude: String(latitude), longitude: String(longitude)},
        });
    }
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Météo</Text>
            </View>

            <SearchBar onSelect={onSelectFromSearch}/>

            <Text style={styles.section}>Villes favorites</Text>

            <FlatList
                data={favorites}
                keyExtractor={(i) => `${i.name}_${i.latitude}_${i.longitude}`}
                renderItem={({item}) => (
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            router.push({
                                pathname: "/details",
                                params: {
                                    name: item.name,
                                    latitude: String(item.latitude),
                                    longitude: String(item.longitude)
                                },
                            })
                        }
                    >
                        <View>
                            <Text style={styles.cityName}>{item.name}</Text>
                        </View>
                        <Text style={styles.temp}>—</Text>
                    </Pressable>
                )}
                contentContainerStyle={{paddingBottom: 40}}
                ListEmptyComponent={() => (
                    <Text style={{marginTop: 12, color: "#666"}}>Aucun favori pour l'instant</Text>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, paddingHorizontal: 16, paddingTop: 24, backgroundColor: "#FFE3E0"},
    header: {marginBottom: 8},
    title: {fontSize: 28, fontWeight: "800", color: "#F38375"},
    section: {marginTop: 12, fontWeight: "700", color: "#F38375"},
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cityName: {fontWeight: "700"},
    country: {color: "#666", marginTop: 2},
    temp: {fontWeight: "800"},
});
