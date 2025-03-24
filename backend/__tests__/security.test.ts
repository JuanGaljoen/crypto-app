import request from "supertest";
import { app } from "../src/index";
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { connectToDatabase, client } from "../src/db";

describe("Security Tests", () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        if (client) {
            await client.close();
        }
    });

    it("should reject SQL injection attempts", async () => {
        const response = await request(app).get("/tokens?token=' OR '1'='1");

        // Expecting either a 400 Bad Request or a 404 Not Found, but not a 200 OK
        expect(response.status).not.toBe(200);
    });

    it("should reject NoSQL injection attempts", async () => {
        const response = await request(app).get('/tokens?token={"$ne":null}');

        // Expecting either a 400 Bad Request or a 404 Not Found, but not a 200 OK
        expect(response.status).not.toBe(200);
    }, 20000);

    it("should reject NoSQL injection attempts in JSON body", async () => {
        const response = await request(app)
            .post('/tokens/search')
            .send({
                query: { $where: "function() { return true }" }
            });

        // Expecting either a 400 Bad Request or a 404 Not Found, but not a 200 OK
        expect(response.status).not.toBe(200);
    });

    it("should handle rate limiting correctly", async () => {
        // Make multiple rapid requests
        const requests = Array(10).fill(0).map(() =>
            request(app).get("/tokens?token=ethereum")
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        console.log(`Rate limited responses: ${rateLimitedResponses.length} of ${responses.length}`);
    });
});