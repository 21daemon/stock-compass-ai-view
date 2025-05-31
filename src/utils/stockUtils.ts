
// Simulated stock data generator for demo purposes
export interface StockData {
  time: string;
  price: number;
  volume?: number;
  prediction?: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  prediction?: number;
}

// Popular stocks for demo
export const POPULAR_STOCKS: Omit<Stock, 'price' | 'change' | 'changePercent' | 'volume'>[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
];

// Generate realistic stock price movements
export const generateStockData = (symbol: string, days: number = 30): StockData[] => {
  const data: StockData[] = [];
  let basePrice = getBasePriceForSymbol(symbol);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some realistic price movement
    const volatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    basePrice = basePrice * (1 + randomChange);
    
    data.push({
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.max(1, basePrice), // Ensure price stays positive
      volume: Math.floor(Math.random() * 50000000) + 10000000, // 10M - 60M volume
    });
  }
  
  return data;
};

// Simple prediction algorithm (moving average + trend)
export const generatePrediction = (historicalData: StockData[], days: number = 5): StockData[] => {
  if (historicalData.length < 5) return [];
  
  const predictions: StockData[] = [];
  const recentPrices = historicalData.slice(-10).map(d => d.price);
  const movingAverage = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  
  // Calculate trend (simple linear regression slope)
  const trend = calculateTrend(recentPrices);
  
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Predict based on moving average + trend + some randomness
    const prediction = movingAverage + (trend * i) + (Math.random() - 0.5) * movingAverage * 0.01;
    
    predictions.push({
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: 0, // Not used for prediction points
      prediction: Math.max(1, prediction),
    });
  }
  
  return predictions;
};

export const generateCurrentStockPrice = (symbol: string): Stock => {
  const baseInfo = POPULAR_STOCKS.find(s => s.symbol === symbol) || { symbol, name: `${symbol} Inc.` };
  const basePrice = getBasePriceForSymbol(symbol);
  
  // Add daily variation
  const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
  const price = basePrice * (1 + changePercent / 100);
  const change = price - basePrice;
  
  return {
    ...baseInfo,
    price,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 50000000) + 10000000,
    prediction: price * (1 + (Math.random() - 0.4) * 0.1), // Slight bias towards growth
  };
};

function getBasePriceForSymbol(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    'AAPL': 180,
    'GOOGL': 140,
    'MSFT': 380,
    'AMZN': 145,
    'TSLA': 250,
    'META': 320,
    'NFLX': 450,
    'NVDA': 480,
  };
  
  return basePrices[symbol] || 100 + Math.random() * 200;
}

function calculateTrend(prices: number[]): number {
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = prices;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}

// Market overview data
export const generateMarketOverview = () => {
  return {
    sp500: {
      value: 4500 + Math.random() * 200,
      change: (Math.random() - 0.5) * 2,
    },
    nasdaq: {
      value: 14000 + Math.random() * 1000,
      change: (Math.random() - 0.5) * 2,
    },
    dow: {
      value: 35000 + Math.random() * 2000,
      change: (Math.random() - 0.5) * 2,
    },
  };
};
