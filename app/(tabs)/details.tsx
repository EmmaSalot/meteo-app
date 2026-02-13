import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SearchBar from "../components/searchBar";
import { addFavorite, removeFavorite, isFavorite } from "@/services/favorites";

type Params = {
    name?: string;
    latitude?: string;
    longitude?: string;
};

type DailyRow = {
    date: string;
    temp_max: number;
    temp_min: number;
    weathercode: number;
};

export default function Details() {
    const params = useLocalSearchParams<Params>();
    const router = useRouter();

    const name = params.name ?? "—";
    const lat = params.latitude ? parseFloat(params.latitude) : undefined;
    const lon = params.longitude ? parseFloat(params.longitude) : undefined;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTemp, setCurrentTemp] = useState<number | null>(null);
    const [daily, setDaily] = useState<DailyRow[]>([]);

    const [favState, setFavState] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (typeof lat === "number" && typeof lon === "number") {
                try {
                    const fav = await isFavorite({ name, latitude: lat, longitude: lon });
                    if (mounted) setFavState(Boolean(fav));
                } catch {
                    if (mounted) setFavState(false);
                }
            } else {
                setFavState(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [name, lat, lon]);

    async function toggleFavorite() {
        if (typeof lat !== "number" || typeof lon !== "number") return;
        const fav = { name, latitude: lat, longitude: lon };
        if (favState) {
            await removeFavorite(fav);
            setFavState(false);
        } else {
            await addFavorite(fav);
            setFavState(true);
        }
    }

    useEffect(() => {
        if (typeof lat !== "number" || typeof lon !== "number") {
            setError("Coordonnées manquantes");
            setCurrentTemp(null);
            setDaily([]);
            return;
        }

        const today = new Date();
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        function toYMD(d: Date) {
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        }
        const startDate = toYMD(today);
        const end = new Date(today);
        end.setDate(end.getDate() + 6);
        const endDate = toYMD(end);

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
            String(lat)
        )}&longitude=${encodeURIComponent(String(lon))}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${startDate}&end_date=${endDate}`;

        let mounted = true;
        setLoading(true);
        setError(null);

        fetch(url)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => {
                if (!mounted) return;
                if (json.current_weather && typeof json.current_weather.temperature === "number") {
                    setCurrentTemp(json.current_weather.temperature);
                } else {
                    setCurrentTemp(null);
                }

                if (
                    json.daily &&
                    Array.isArray(json.daily.time) &&
                    Array.isArray(json.daily.temperature_2m_max)
                ) {
                    const times: string[] = json.daily.time;
                    const tmax: number[] = json.daily.temperature_2m_max;
                    const tmin: number[] = json.daily.temperature_2m_min ?? [];
                    const codes: number[] = json.daily.weathercode ?? [];

                    const rows: DailyRow[] = times.map((d, i) => ({
                        date: d,
                        temp_max: typeof tmax[i] === "number" ? tmax[i] : NaN,
                        temp_min: typeof tmin[i] === "number" ? tmin[i] : NaN,
                        weathercode: typeof codes[i] === "number" ? codes[i] : -1,
                    }));
                    setDaily(rows);
                } else {
                    setDaily([]);
                }
            })
            .catch((err) => {
                console.warn("Open-Meteo fetch error:", err);
                if (!mounted) return;
                setError("Impossible de charger la météo");
                setCurrentTemp(null);
                setDaily([]);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [lat, lon]);

    function weatherLabel(code: number) {
        if (code === 0) return { emoji: "☀️" };
        if (code === 1 || code === 2 || code === 3) return { emoji: "🌤️" };
        if (code === 45 || code === 48) return { emoji: "🌫️" };
        if (code === 51 || code === 53 || code === 55) return { emoji: "🌦️" };
        if (code === 61 || code === 63 || code === 65) return { emoji: "🌧️" };
        if (code === 66 || code === 67) return { emoji: "🌧️❄️" };
        if (code === 71 || code === 73 || code === 75 || code === 77) return { emoji: "❄️" };
        if (code === 80 || code === 81 || code === 82) return { emoji: "🌦️" };
        if (code === 95 || code === 96 || code === 99) return { emoji: "⛈️" };
        return { emoji: "❓", label: "Inconnu" };
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{name}</Text>
                <View style={styles.searchWrapper}>
                    <SearchBar
                        onSelect={({ name: n, latitude, longitude }) =>
                            router.replace({
                                pathname: "/details",
                                params: { name: n, latitude: String(latitude), longitude: String(longitude) },
                            })
                        }
                        minCharsToSearch={2}
                    />
                </View>
            </View>

            <View style={styles.body}>
                {loading ? (
                    <ActivityIndicator size="large" style={{ marginVertical: 24 }} />
                ) : error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : (
                    <>
                        <View style={styles.currentWrap}>
                            <Text style={styles.currentTemp}>
                                {currentTemp !== null ? `${Math.round(currentTemp)}°C` : "—"}
                            </Text>

                            <Pressable
                                onPress={toggleFavorite}
                                style={styles.favButton}
                            >
                                <Text style={styles.starIcon}>
                                    {favState ? "★" : "☆"}
                                </Text>
                                <Text style={styles.favButtonText}>
                                    {favState ? "Retirer des favoris" : "Ajouter aux favoris"}
                                </Text>
                            </Pressable>
                        </View>

                        <View style={styles.tableHeader}>
                            <Text style={[styles.colDate]}>Date</Text>
                            <Text style={[styles.colTemp]}>Temp°</Text>
                            <Text style={[styles.colWeather]}>Météo</Text>
                        </View>

                        <FlatList
                            data={daily}
                            keyExtractor={(item) => item.date}
                            style={styles.table}
                            scrollEnabled={false}
                            renderItem={({ item }) => {
                                const w = weatherLabel(item.weathercode);
                                const displayTemp =
                                    Number.isFinite(item.temp_max) && Number.isFinite(item.temp_min)
                                        ? `${Math.round(item.temp_max)}° / ${Math.round(item.temp_min)}°`
                                        : `${Number.isFinite(item.temp_max) ? Math.round(item.temp_max) + "°" : "—"}`;

                                const d = new Date(item.date + "T00:00:00");

                                const dayMonth = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

                                const weekdayShort = d.toLocaleDateString("fr-FR", { weekday: "short" });

                                const dateLabel = `${dayMonth} ${weekdayShort}`;

                                return (
                                    <View style={styles.tableRow}>
                                        <Text style={styles.colDate}>{dateLabel}</Text>
                                        <Text style={styles.colTemp}>{displayTemp}</Text>
                                        <Text style={styles.colWeather}>
                                            <View style={styles.weatherBadge}>
                                                <Text style={styles.weatherEmoji}>{w.emoji}</Text>
                                            </View>
                                        </Text>
                                    </View>
                                );
                            }}
                            ListFooterComponent={() =>
                                daily.length === 0 ? null : daily.length < 7 ? (
                                    <Text style={{ marginTop: 8, color: "#666" }}>Données partielles ({daily.length} jours)</Text>
                                ) : null
                            }
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 24, paddingHorizontal: 16, backgroundColor: "#FFE3E0" },
    headerRow: { flexDirection: "row", alignItems: "center" },
    title: { fontSize: 22, fontWeight: "800", marginRight: 12, color: "#2E2220" },
    searchWrapper: { flex: 1 },
    body: { marginTop: 20 },
    error: { color: "crimson" },

    currentWrap: {
        alignItems: "center",
        marginBottom: 18,
        paddingVertical: 8,
        backgroundColor: "#fff",
        borderRadius: 8,
    },
    currentTemp: {
        fontSize: 48,
        fontWeight: "900",
        color: "#2E2220",
    },
    favButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#F38375",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    starIcon: {
        fontSize: 24,
        color: "#FFE3E0",
    },
    favButtonText: {
        fontWeight: "600",
        color: "#fff",
        fontSize: 14,
    },
    table: {
        marginTop: 6,
    },
    tableHeader: {
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#eee",
        backgroundColor: "#fafafa",
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#F38375",
        alignItems: "center",
        paddingHorizontal: 8,
    },

    colDate: {
        flex: 2,
        fontWeight: "600",
    },
    colTemp: {
        flex: 1.2,
        textAlign: "center",
        fontWeight: "600",
    },
    colWeather: {
        flex: 2,
        textAlign: "right",
    },
    weatherBadge: {
        backgroundColor: "#FFF5F4",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    weatherEmoji: {
        fontSize: 18,
    },
});
