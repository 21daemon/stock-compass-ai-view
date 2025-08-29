
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  change: number;
  changePercent: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, currentPrice, historicalData } = await req.json();
    
    // Get real market data from Financial Modeling Prep API (free tier)
    const marketData = await getMarketData(symbol);
    
    // Get additional technical indicators
    const technicalData = await getTechnicalIndicators(symbol);
    
    // Use Gemini to analyze the data and make predictions
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    const prediction = await callGeminiForAnalysis(
      geminiApiKey,
      symbol,
      marketData,
      technicalData,
      historicalData
    );

    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in gemini-stock-prediction:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getMarketData(symbol: string): Promise<MarketData> {
  try {
    // Use Alpha Vantage API for real market data
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`
    );
    
    if (!response.ok) {
      throw new Error(`Stock ${symbol} not found`);
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error(`Stock ${symbol} not found`);
    }
    
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    
    return {
      symbol: quote['01. symbol'],
      price: price,
      volume: parseInt(quote['06. volume']),
      marketCap: Math.round(price * parseInt(quote['06. volume']) / 1000000),
      peRatio: 0, // Not available in Alpha Vantage basic
      change: change,
      changePercent: changePercent,
    };
  } catch (error) {
    console.error('Market data fetch error:', error);
    throw new Error(`Unable to fetch data for ${symbol}. Stock may not exist.`);
  }
}

async function getTechnicalIndicators(symbol: string) {
  try {
    // Get historical data for technical analysis
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=demo&outputsize=compact`
    );
    
    if (!response.ok) {
      throw new Error(`Technical data for ${symbol} not found`);
    }
    
    const data = await response.json();
    const timeSeries = data['Time Series (Daily)'];
    
    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      throw new Error(`Technical data for ${symbol} not found`);
    }
    
    // Calculate basic indicators from price data
    const prices = Object.values(timeSeries).slice(0, 14).map((day: any) => parseFloat(day['4. close']));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const currentPrice = prices[0];
    
    return {
      rsi: currentPrice > avgPrice ? 65 : 35,
      trend: currentPrice > avgPrice ? 'bullish' : 'bearish',
      support: Math.min(...prices) * 0.98,
      resistance: Math.max(...prices) * 1.02,
    };
  } catch (error) {
    console.error('Technical indicators fetch error:', error);
    throw new Error(`Unable to fetch technical data for ${symbol}`);
  }
}

async function callGeminiForAnalysis(
  apiKey: string,
  symbol: string,
  marketData: MarketData,
  technicalData: any,
  historicalPrices: number[]
) {
  const prompt = `
You are a professional stock market analyst. Analyze the following data for ${symbol} and provide a price prediction for the next trading day.

Current Market Data:
- Current Price: $${marketData.price}
- Volume: ${marketData.volume}
- Market Cap: $${marketData.marketCap}
- P/E Ratio: ${marketData.peRatio}
- Daily Change: ${marketData.changePercent}%

Technical Indicators:
- RSI: ${technicalData.rsi}
- Trend: ${technicalData.trend}

Historical Prices (last 30 days): [${historicalPrices.slice(-30).join(', ')}]

Based on this data, provide:
1. A predicted price for tomorrow (be realistic, typically within ±5% of current price)
2. Confidence level (50-95%)
3. Brief reasoning (2-3 sentences)

Respond in JSON format:
{
  "price": number,
  "confidence": number,
  "reasoning": "string"
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        price: result.price,
        confidence: result.confidence,
        reasoning: result.reasoning
      };
    }
    
    throw new Error('Invalid response format from Gemini');
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw new Error(`AI prediction failed for ${symbol}. Please try again later.`);
  }
}
