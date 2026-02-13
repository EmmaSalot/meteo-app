import AsyncStorage from "@react-native-async-storage/async-storage";

export type Favorite = {
    name: string;
    latitude: number;
    longitude: number;
};

const STORAGE_KEY = "FAVORITES_V1";

export async function getFavorites(): Promise<Favorite[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Favorite[]) : [];
    } catch (err) {
        console.warn("getFavorites error", err);
        return [];
    }
}

export async function saveFavorites(favs: Favorite[]): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    } catch (err) {
        console.warn("saveFavorites error", err);
    }
}

export async function addFavorite(fav: Favorite): Promise<void> {
    try {
        const list = await getFavorites();
        // avoid duplicates by exact match on name+coords
        const exists = list.some(
            (f) =>
                f.name === fav.name &&
                Number(f.latitude) === Number(fav.latitude) &&
                Number(f.longitude) === Number(fav.longitude)
        );
        if (!exists) {
            list.unshift(fav); // push front so newest fav first
            await saveFavorites(list);
        }
    } catch (err) {
        console.warn("addFavorite error", err);
    }
}

export async function removeFavorite(fav: Favorite): Promise<void> {
    try {
        const list = await getFavorites();
        const filtered = list.filter(
            (f) =>
                !(
                    f.name === fav.name &&
                    Number(f.latitude) === Number(fav.latitude) &&
                    Number(f.longitude) === Number(fav.longitude)
                )
        );
        await saveFavorites(filtered);
    } catch (err) {
        console.warn("removeFavorite error", err);
    }
}

export async function isFavorite(fav: Favorite): Promise<boolean> {
    try {
        const list = await getFavorites();
        return list.some(
            (f) =>
                f.name === fav.name &&
                Number(f.latitude) === Number(fav.latitude) &&
                Number(f.longitude) === Number(f.longitude)
        );
    } catch (err) {
        console.warn("isFavorite error", err);
        return false;
    }
}
