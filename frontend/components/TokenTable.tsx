'use client';

import { FC } from 'react';
import { TokenData } from '@/lib/types';

interface TokenTableProps {
    tokens: Record<string, TokenData>;
    onSelectToken: (token: string) => void;
    selectedToken: string;
}

const TokenTable: FC<TokenTableProps> = ({ tokens, onSelectToken, selectedToken }) => {
    // Format numbers for display
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatLargeNumber = (value: number): string => {
        if (value >= 1_000_000_000) {
            return `$${(value / 1_000_000_000).toFixed(2)}B`;
        } else if (value >= 1_000_000) {
            return `$${(value / 1_000_000).toFixed(2)}M`;
        }
        return formatCurrency(value);
    };

    const formatPercentage = (value: number): string => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    return (
        <div className="w-full overflow-auto rounded-lg shadow">
            <table className="w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Coin
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            1h
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            24h
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            7d
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            24h Volume
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Market Cap
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.entries(tokens).length === 0 ? (
                        <tr>
                            <td colSpan={7} className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                                Loading token data...
                            </td>
                        </tr>
                    ) : (
                        Object.entries(tokens).map(([id, token]) => (
                            <tr
                                key={id}
                                className={`cursor-pointer transition hover:bg-gray-50 ${selectedToken === id ? 'bg-blue-50' : ''}`}
                                onClick={() => onSelectToken(id)}
                            >
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <img className="h-10 w-10 rounded-full" src={token.image} alt={token.name} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{token.name}</div>
                                            <div className="text-sm text-gray-500">{token.symbol.toUpperCase()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                                    {formatCurrency(token.price)}
                                </td>
                                <td
                                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${token.price_change_1h >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {formatPercentage(token.price_change_1h)}
                                </td>
                                <td
                                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${token.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {formatPercentage(token.price_change_24h)}
                                </td>
                                <td
                                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${token.price_change_7d >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {formatPercentage(token.price_change_7d)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                                    {formatLargeNumber(token.volume_24h)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                                    {formatLargeNumber(token.market_cap)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TokenTable;