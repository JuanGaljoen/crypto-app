import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Collection } from "mongodb";
import { test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

// Import the specific functions you need
import { saveTokenData, setTokenCollection, getTokenHistoricalData } from "../src/db";

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;
let tokenCollection: Collection;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Connect using MongoClient
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    // Get the test database and collection
    const testDb = mongoClient.db("testdb");
    tokenCollection = testDb.collection("tokens");

    // Set the token collection in your db module
    setTokenCollection(testDb);
});

afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    await tokenCollection.deleteMany({});
});

test("should save token data to the database", async () => {
    const tokenData = {
        id: "ethereum",
        name: "Ethereum",
        price: 2000,
    };

    await saveTokenData(tokenData);

    // Use the local tokenCollection reference for querying
    const savedToken = await tokenCollection.findOne({ id: "ethereum" });

    expect(savedToken).toBeTruthy();
    expect(savedToken?.name).toBe("Ethereum");
    expect(savedToken?.price).toBe(2000);
    expect(savedToken?.timestamp).toBeDefined();
});

// Add test for rate limiting feature
test("should only save token data once per minute", async () => {
    const originalDateNow = Date.now;
    const currentTime = originalDateNow();

    // @ts-ignore - Temporarily ignore TypeScript during the mock
    Date.now = jest.fn(() => currentTime);

    try {
        const tokenData = {
            id: "bitcoin",
            name: "Bitcoin",
            price: 50000,
        };

        // First save
        await saveTokenData(tokenData);

        // Update price
        const updatedData = { ...tokenData, price: 51000 };

        // Try to save again immediately (should be rate limited)
        await saveTokenData(updatedData);

        // Check that the first price was saved, not the updated one
        const savedToken = await tokenCollection.findOne({ id: "bitcoin" });
        expect(savedToken?.price).toBe(50000); // Should be the original price

        // Now simulate time passing by updating the mock
        // @ts-ignore - Temporarily ignore TypeScript during the mock
        Date.now = jest.fn(() => currentTime + 61000); // 61 seconds later

        // Now try saving again after "time has passed"
        await saveTokenData(updatedData);

        // Check that the update succeeded
        const updatedToken = await tokenCollection.findOne({ id: "bitcoin" });
        expect(updatedToken?.price).toBe(51000);
    } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
    }
});

// Test for getTokenHistoricalData
test("should retrieve historical token data", async () => {
    const now = Date.now();
    const tokenId = "ethereum";

    // Insert multiple data points with different timestamps
    await tokenCollection.insertMany([
        { id: tokenId, price: 2000, timestamp: new Date(now - 300000) },
        { id: tokenId, price: 2100, timestamp: new Date(now - 200000) },
        { id: tokenId, price: 2200, timestamp: new Date(now - 100000) },
        { id: tokenId, price: 2300, timestamp: new Date(now) }
    ]);

    // Get historical data
    const history = await getTokenHistoricalData(tokenId, 2);  // Limit to 2 entries

    // Verify results
    expect(history.length).toBe(2);
    expect(history[0].price).toBe(2300);  // Most recent should be first
    expect(history[1].price).toBe(2200);  // Second most recent
});