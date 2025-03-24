'use client';

import { FC, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { OHLCData } from '@/lib/types';

interface PriceChartProps {
    data: OHLCData;
}

const PriceChart: FC<PriceChartProps> = ({ data }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any | null>(null);

    useEffect(() => {
        if (chartContainerRef.current && data.length > 0) {
            // Clear previous chart if it exists
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }

            // Create new chart
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 400,
                layout: {
                    background: { type: ColorType.Solid, color: '#ffffff' },
                    textColor: '#333',
                },
                grid: {
                    vertLines: { color: '#f0f0f0' },
                    horzLines: { color: '#f0f0f0' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            // Format data for candlestick series
            const ohlcData = data.map(item => ({
                time: item[0] / 1000, // Convert milliseconds to seconds for lightweight-charts
                open: item[1],
                high: item[2],
                low: item[3],
                close: item[4],
            }));

            // Use type assertion to bypass TypeScript errors
            const anyChart = chart as any;

            // Add candlestick series
            const candlestickSeries = anyChart.addCandlestickSeries({
                upColor: '#4CAF50',
                downColor: '#F44336',
                borderVisible: false,
                wickUpColor: '#4CAF50',
                wickDownColor: '#F44336',
            });

            candlestickSeries.setData(ohlcData);

            // Add volume series under the price chart
            const volumeSeries = anyChart.addHistogramSeries({
                color: '#26a69a',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });

            const volumeData = ohlcData.map(item => ({
                time: item.time,
                value: (item.close - item.open) > 0 ?
                    Math.random() * 1000000 + 500000 : // Simulated volume
                    Math.random() * 1000000 + 500000,
                color: (item.close - item.open) > 0 ? '#4CAF50' : '#F44336',
            }));

            volumeSeries.setData(volumeData);

            // Fit content
            chart.timeScale().fitContent();

            // Handle window resize
            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({
                        width: chartContainerRef.current.clientWidth
                    });
                }
            };

            window.addEventListener('resize', handleResize);

            // Save chart reference for cleanup
            chartRef.current = chart;

            return () => {
                window.removeEventListener('resize', handleResize);
                if (chartRef.current) {
                    chartRef.current.remove();
                }
            };
        }
    }, [data]);

    return (
        <div className="bg-white p-4 rounded-lg shadow w-full">
            {data.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                    <p>No chart data available</p>
                </div>
            ) : (
                <div ref={chartContainerRef} className="w-full h-96" />
            )}
        </div>
    );
};

export default PriceChart;