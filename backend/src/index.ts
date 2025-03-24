import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getOHLCData, getTokenDetails } from "./api";
import { connectToDatabase } from "./db";
import http from "http"; // Import http for Server type

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5001", 10);

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

connectToDatabase().catch((err) =>
    console.error("Failed to connect to MongoDB:", err)
);

app.get("/tokens", getTokenDetails);
app.get("/ohlc", getOHLCData);

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        message: "An unexpected error occurred",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

export function startServer(port: number = PORT): http.Server {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    process.on("SIGTERM", () => {
        server.close(() => {
            console.log("Server terminated");
        });
    });

    return server;
}

if (require.main === module) {
    startServer();
}

export { app };