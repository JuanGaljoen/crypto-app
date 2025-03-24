'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import TokenTable from "../components/TokenTable";
import PriceChart from "../components/PriceChart";
import { TokenData, OHLCData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [tokensData, setTokensData] = useState<Record<string, TokenData>>({});
  const [ohlcData, setOhlcData] = useState<OHLCData>([]);
  const [selectedToken, setSelectedToken] = useState<string>("ethereum");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokensData = async () => {
    try {
      const response = await axios.get(`${API_URL}/tokens`);
      setTokensData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching tokens data:", err);
      setError("Failed to load token data. Please try again later.");
    }
  };

  const fetchOHLCData = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ohlc`, {
        params: { token, days: 7 }
      });
      setOhlcData(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching OHLC data:", err);
      setError("Failed to load chart data. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokensData();
    fetchOHLCData(selectedToken);

    const interval = setInterval(() => {
      fetchTokensData();
      fetchOHLCData(selectedToken);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedToken]);

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
  };

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Crypto Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cryptocurrency Data</h2>
        <TokenTable
          tokens={tokensData}
          onSelectToken={handleTokenSelect}
          selectedToken={selectedToken}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          7-Day OHLC Chart: {selectedToken.charAt(0).toUpperCase() + selectedToken.slice(1)}
        </h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p>Loading chart data...</p>
          </div>
        ) : (
          <PriceChart data={ohlcData} />
        )}
      </div>
    </main>
  );
}