import axios from "axios";
import { Request, Response } from "express";
import { redisClient } from "./cache";
import { saveTokenData } from "./db";

const COINGECKO_API_URL = process.env.COINGECKO_API_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

async function makeRateLimitedRequest(url: string, params: any, headers: any, maxRetries = 3): Promise<any> {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            return await axios.get(url, { params, headers });
        } catch (error: any) {
            if (error.response && error.response.status === 429) {
                // Get retry time from header or default to 6 seconds
                const retryAfter = parseInt(error.response.headers['retry-after']) || 6;
                console.log(`Rate limited by CoinGecko API. Waiting ${retryAfter} seconds...`);

                // Wait for the specified time
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                retries++;
            } else {
                // If it's not a rate limit error, throw it immediately
                throw error;
            }
        }
    }

    throw new Error(`Failed after ${maxRetries} retries due to rate limiting`);
}

// Function to fetch token details (price, changes, volume, market cap)
export async function getTokenDetails(req: Request, res: Response): Promise<void> {
    try {
        const tokens = ['ethereum', 'aver-ai'];
        const requestedToken = req.query.token as string;

        if (requestedToken && !tokens.includes(requestedToken)) {
            tokens.push(requestedToken);
        }

        const results: Record<string, any> = {};

        for (const token of tokens) {
            const cacheKey = `token:${token}`;

            // Check Redis cache first
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                results[token] = JSON.parse(cachedData);
                continue;
            }

            // Fetch from CoinGecko if not in cache with rate limiting
            const response = await makeRateLimitedRequest(
                `${COINGECKO_API_URL}/coins/${token}`,
                {
                    localization: false,
                    tickers: false,
                    market_data: true,
                    community_data: false,
                    developer_data: false
                },
                { 'x-cg-api-key': API_KEY }
            );

            // Extract relevant data
            const tokenData = {
                id: response.data.id,
                name: response.data.name,
                symbol: response.data.symbol,
                image: response.data.image.small,
                price: response.data.market_data.current_price.usd,
                price_change_1h: response.data.market_data.price_change_percentage_1h_in_currency.usd,
                price_change_24h: response.data.market_data.price_change_percentage_24h,
                price_change_7d: response.data.market_data.price_change_percentage_7d,
                volume_24h: response.data.market_data.total_volume.usd,
                market_cap: response.data.market_data.market_cap.usd,
                last_updated: response.data.market_data.last_updated
            };

            // Store in Redis with 30-second expiry
            await redisClient.set(cacheKey, JSON.stringify(tokenData), "EX", 30);

            // Store in MongoDB (storing only once per minute is handled in the db.ts)
            await saveTokenData(tokenData);

            results[token] = tokenData;
        }

        res.json(results);
    } catch (error) {
        console.error("Error fetching token details:", error);
        res.status(500).json({ message: "Error fetching token details" });
    }
}

// Function to fetch OHLC data
export async function getOHLCData(req: Request, res: Response): Promise<void> {
    try {
        const token = (req.query.token as string) || "ethereum";
        const days = (req.query.days as string) || "7";
        const cacheKey = `ohlc:${token}:${days}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            res.json(JSON.parse(cachedData));
            return;
        }

        // Fetch data from CoinGecko with rate limiting
        const response = await makeRateLimitedRequest(
            `${COINGECKO_API_URL}/coins/${token}/ohlc`,
            { vs_currency: "usd", days: days },
            { 'x-cg-api-key': API_KEY }
        );

        const data = response.data;

        // Store in Redis with a 30-second expiry
        await redisClient.set(cacheKey, JSON.stringify(data), "EX", 30);

        res.json(data);
    } catch (error) {
        console.error("Error fetching OHLC data:", error);
        res.status(500).json({ message: "Error fetching OHLC data" });
    }
}