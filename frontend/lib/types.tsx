export interface TokenData {
    id: string;
    name: string;
    symbol: string;
    image: string;
    price: number;
    price_change_1h: number;
    price_change_24h: number;
    price_change_7d: number;
    volume_24h: number;
    market_cap: number;
    last_updated: string;
}

export type OHLCData = Array<[number, number, number, number, number]>; 