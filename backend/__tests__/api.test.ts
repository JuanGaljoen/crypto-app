import { describe, it, expect, jest, beforeAll, beforeEach, afterAll } from "@jest/globals";
import request from "supertest";
import { app, startServer } from "../src/index";
import { redisClient } from "../src/cache"; // Will be mocked
import { connectToDatabase, saveTokenData, client } from "../src/db"; // Will be mocked
import axios from "axios";
import http from "http";
import { createClient } from "redis-mock";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockRedis = createClient();

jest.mock("../src/cache", () => {
    return {
        redisClient: {
            connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            get: jest.fn<(key: string) => Promise<string | null>>().mockImplementation(async (key: string) => {
                const value = await mockRedis.get(key);
                return typeof value === "boolean" ? null : value; // Ensure it returns string | null
            }),
            set: jest.fn<(key: string, value: string, mode: string, ttl: number) => Promise<void>>().mockImplementation(
                async (key: string, value: string, mode: string, ttl: number) => {
                    mockRedis.setex(key, ttl, value);
                    return Promise.resolve(); // Ensures it returns a Promise<void>
                }
            ),
            quit: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        },
    };
});

jest.mock("../src/db", () => {
    const mockDb = new Map<string, any>();
    return {
        connectToDatabase: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        saveTokenData: jest.fn<(data: any) => Promise<void>>().mockImplementation(async (data: any) => {
            mockDb.set(data.id, data);
        }),
        client: {
            close: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        },
    };
});

describe("API Endpoints", () => {
    let server: http.Server;

    beforeAll(async () => {
        await connectToDatabase();
        await redisClient.connect();
        server = startServer(0);
    });

    afterAll(async () => {
        server.close();
        await redisClient.quit();
        if (client) await client.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (redisClient.get as jest.MockedFunction<(key: string) => Promise<string | null>>).mockResolvedValue(null);
    });

    it("should return token details", async () => {
        mockedAxios.get.mockResolvedValue({
            data: {
                id: "ethereum",
                name: "Ethereum",
                symbol: "ETH",
                image: { small: "http://example.com/eth.png" },
                market_data: {
                    current_price: { usd: 3000 },
                    price_change_percentage_1h_in_currency: { usd: 1.5 },
                    price_change_percentage_24h: 2.0,
                    price_change_percentage_7d: 5.0,
                    total_volume: { usd: 1000000 },
                    market_cap: { usd: 350000000000 },
                    last_updated: "2025-03-24T12:00:00Z",
                },
            },
        });

        const response = await request(app).get("/tokens?token=ethereum");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("ethereum");
        expect(response.body.ethereum).toMatchObject({
            id: "ethereum",
            name: "Ethereum",
            price: 3000,
        });
        expect(redisClient.set).toHaveBeenCalled();
        expect(saveTokenData).toHaveBeenCalled();
    });

    it("should return OHLC data", async () => {
        mockedAxios.get.mockResolvedValue({
            data: [
                [1617187200000, 2000, 2100, 1900, 2050],
                [1617273600000, 2050, 2150, 2000, 2100],
            ],
        });

        const response = await request(app).get("/ohlc?token=ethereum&days=7");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);
        expect(redisClient.set).toHaveBeenCalled();
    });
});