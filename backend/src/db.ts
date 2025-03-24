import { MongoClient, Collection, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "";
const DB_NAME = process.env.DB_NAME;

export let tokenCollection: Collection;
let client: MongoClient;

// Track last update time for each token to enforce 1-minute updates
const lastUpdateTimes: Record<string, number> = {};

export async function connectToDatabase(): Promise<void> {
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        const db = client.db(DB_NAME);
        tokenCollection = db.collection("tokens");

        // Create index on id field
        await tokenCollection.createIndex({ id: 1 });
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }
}

export function setTokenCollection(db: Db) {
    tokenCollection = db.collection("tokens");
}

export async function saveTokenData(data: any): Promise<void> {
    try {
        const tokenId = data.id;
        const currentTime = Date.now();

        // Only save if more than 1 minute has passed since last save for this token
        if (!lastUpdateTimes[tokenId] || currentTime - lastUpdateTimes[tokenId] >= 60000) {
            // Upsert operation - update if exists, insert if not
            await tokenCollection.updateOne(
                { id: tokenId },
                { $set: { ...data, timestamp: new Date() } },
                { upsert: true }
            );

            lastUpdateTimes[tokenId] = currentTime;
            console.log(`Saved data for ${tokenId} to MongoDB`);
        }
    } catch (error) {
        console.error("Error saving token data:", error);
    }
}

export async function getTokenHistoricalData(tokenId: string, limit: number = 100): Promise<any[]> {
    try {
        return await tokenCollection
            .find({ id: tokenId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    } catch (error) {
        console.error("Error retrieving historical data:", error);
        return [];
    }
}

export { client }; 