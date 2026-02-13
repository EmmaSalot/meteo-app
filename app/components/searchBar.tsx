import React, { useState } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
} from "react-native";

type GeoResult = {
    id: string;
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
    admin1?: string;
};

type Props = {
    onSelect?: (coords: { name: string; latitude: number; longitude: number }) => void;
    minCharsToSearch?: number;
};

export default function SearchBar({ onSelect, minCharsToSearch = 2 }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeoResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<GeoResult | null>(null);
    const [showResults, setShowResults] = useState(false);

    async function performSearch() {
        const term = query.trim();
        if (term.length < minCharsToSearch) {
            setError(`Tape au moins ${minCharsToSearch} caractères`);
            setResults([]);
            setShowResults(false);
            return;
        }

        setLoading(true);
        setError(null);
        setShowResults(false);

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            term
        )}&count=10&language=en&format=json`;

        try {
            const res = await fetch(url);
            const json = await res.json();

            const items = Array.isArray(json.results)
                ? json.results.map((it: any, idx: number) => ({
                    id: `${it.latitude}_${it.longitude}_${idx}`,
                    name: it.name ?? term,
                    country: it.country,
                    admin1: it.admin1,
                    latitude: it.latitude,
                    longitude: it.longitude,
                }))
                : [];

            setResults(items);
            setShowResults(true);
        } catch (err) {
            console.warn("Geocoding error", err);
            setError("Erreur réseau");
            setResults([]);
            setShowResults(false);
        } finally {
            setLoading(false);
        }
    }

    function handleSelect(item: GeoResult) {
        setSelected(item);
        setResults([]);
        setShowResults(false);
        setQuery(item.name);

        onSelect?.({
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
        });
    }

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="Rechercher une ville..."
                    placeholderTextColor="#999"
                    value={query}
                    onChangeText={(t) => {
                        setQuery(t);
                        setSelected(null);
                        setShowResults(false);
                        setResults([]);
                        setError(null);
                    }}
                    style={styles.input}
                    returnKeyType="search"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    onSubmitEditing={() => performSearch()}
                />
                {loading && <ActivityIndicator style={{ marginLeft: 8 }} />}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            {showResults && results.length > 0 && (
                <FlatList
                    data={results}
                    keyExtractor={(i) => i.id}
                    style={styles.resultsList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <Pressable style={styles.resultItem} onPress={() => handleSelect(item)}>
                            <View>
                                <Text style={styles.resultTitle}>
                                    {item.name}
                                    {item.admin1 ? `, ${item.admin1}` : ""}
                                    {item.country ? ` • ${item.country}` : ""}
                                </Text>
                                <Text style={styles.resultSub}>
                                    {item.latitude.toFixed(5)} , {item.longitude.toFixed(5)}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    resultsList: {
        marginTop: 8,
        backgroundColor: "#fff",
        borderRadius: 10,
        maxHeight: 240,
    },
    resultItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    resultTitle: {
        fontWeight: "700",
    },
    resultSub: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
    },
    selected: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#fff",
    },
    selectedText: {
        fontSize: 14,
        color: "#2E2220",
    },
    error: {
        color: "crimson",
        marginTop: 8,
    },
});
