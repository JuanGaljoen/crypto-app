# Token Data API

## Overview
This project provides a comprehensive solution for displaying real-time token data for Ethereum and Aver AI tokens. The system integrates with the CoinGecko API for token information, uses MongoDB Atlas for persistent storage, and implements Redis for caching to improve performance and handle high concurrent user loads.

## Architecture
The application follows a layered architecture:
- Frontend: Next.js with TailwindCSS
- Backend: TypeScript-based API server
- Caching: Redis (30-second refresh)
- Database: MongoDB Atlas (1-minute persistence)
- External API: CoinGecko

## Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account
- Redis (local installation required)
- CoinGecko API key: `CG-32JARN2FnAhPKaq9X68XARkgA`

## Getting Started

### 1. Redis Setup
The application requires Redis to be running locally:

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Install Redis (macOS with Homebrew)
brew install redis

# Start Redis server
redis-server

# Verify Redis is running
redis-cli ping
# Should return "PONG"
```

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/token-data-api.git
cd token-data-api

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```
# API Keys
COINGECKO_API_KEY=CG-32JARN2FnAhPKaq9X68XARkgA

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
```

### 4. Running the Application

```bash
# Start the backend server
npm run dev:server

# In a separate terminal, start the frontend
npm run dev:client
```

The application will be available at `http://localhost:3000`

## Features
- Real-time token data display for Ethereum and Aver AI
- OHLC chart visualization for the last 7 days
- Automatic data refresh every 30 seconds
- High-performance caching layer with Redis
- Persistent storage with MongoDB Atlas

## API Endpoints

### GET /api/tokens
Returns current price information for Ethereum and Aver AI tokens.

### GET /api/tokens/:id/ohlc
Returns OHLC (Open, High, Low, Close) data for the specified token for the last 7 days.

## Testing

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:api
npm run test:db
npm run test:cache
npm run test:security
```

## Performance Considerations
- The system is designed to handle 10K+ concurrent users
- Redis caching reduces load on the CoinGecko API and improves response times
- Efficient data formatting and transfer between layers

flowchart TB
    subgraph "External"
        CG[CoinGecko API]
    end

    subgraph "Backend"
        API[TypeScript API Server]
        Worker[Background Worker]
        Cache[Redis Cache]
        DB[MongoDB Atlas]
        Tests[Automated Tests]
    end

    subgraph "Frontend"
        Client[Next.js Client]
        UI[TailwindCSS UI]
        Chart[OHLC Chart]
    end

    %% External connections
    CG -->|Token Data| API
    
    %% Backend connections
    API -->|Store Data\nevery 1min| DB
    API <-->|Cache Data\nevery 30s| Cache
    Worker -->|Scheduled Updates| API
    Tests -->|Verify| API
    Tests -->|Verify| DB
    Tests -->|Verify| Cache

    %% Frontend connections
    Client -->|API Requests| API
    Client -->|Renders| UI
    Client -->|Displays| Chart
    
    %% Update cycles
    Cache -->|30s Refresh| Cache
    DB -->|1min Overwrite| DB

    %% User interaction
    Users((Users)) -->|10K+ Concurrent| Client

    %% Styling
    classDef external fill:#f96,stroke:#333,stroke-width:2px
    classDef backend fill:#9cf,stroke:#333,stroke-width:2px
    classDef frontend fill:#9f9,stroke:#333,stroke-width:2px
    classDef database fill:#c9f,stroke:#333,stroke-width:2px
    classDef cache fill:#ff9,stroke:#333,stroke-width:2px
    classDef users fill:#fcf,stroke:#333,stroke-width:2px

    class CG external
    class API,Worker,Tests backend
    class Client,UI,Chart frontend
    class DB database
    class Cache cache
    class Users users