import * as SecureStore from "expo-secure-store";

const CHUNK_SIZE = 1800;
const manifestKey = (key: string) => `${key}__manifest`;
const chunkKey = (key: string, index: number) => `${key}__${index}`;

export const secureStorage = {
  async getItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(manifestKey(key)) ?? "0");
    if (!count) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index))));
    return chunks.every((chunk) => chunk !== null) ? chunks.join("") : null;
  },
  async setItem(key: string, value: string) {
    await this.removeItem(key);
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "gs")) ?? [];
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY })));
    await SecureStore.setItemAsync(manifestKey(key), String(chunks.length));
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(manifestKey(key)) ?? "0");
    await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))));
    await SecureStore.deleteItemAsync(manifestKey(key));
  },
};
