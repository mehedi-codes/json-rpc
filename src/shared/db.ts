import type { DatabaseSchema } from "../types/todo";

const dbFileName = "db.json";
const dbFileUrl = new URL(`./${dbFileName}`, import.meta.url);
const dbPath = Bun.fileURLToPath(dbFileUrl);

export const db = {
  read: async () => {
    try {
      const file = Bun.file(dbPath);
      const isExists = await file.exists();
      if (!isExists) {
        throw new Error(`${dbFileName} not found. Check src/${dbFileName} exists.`);
      }
      const data = await file.json();
      return data as DatabaseSchema;
    } catch (error) {
      console.error(`Failed to read ${dbFileName}:`, error);
      throw error;
    }
  },
  write: async (data: DatabaseSchema) => {
    try {
      await Bun.write(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to write to ${dbFileName}:`, error);
      throw error;
    }
  },
} as const;
