
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
    // Use Financial Modeling Prep API with environment variable
    const apiKey = Deno.env.get('FINANCIAL_MODELING_PREP_API_KEY') || 'demo';
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Stock ${symbol} not found`);
    }
    
    const data = await response.json();
    const quote = data[0];
    
    if (!quote || data.error || data['Error Message']) {
      throw new Error(`Stock ${symbol} not found`);
    }
    
    return {
      symbol: quote.symbol,
      price: quote.price,
      volume: quote.volume,
      marketCap: quote.marketCap || Math.round(quote.price * quote.volume / 1000000),
      peRatio: quote.pe || 0,
      change: quote.change,
      changePercent: quote.changesPercentage,
    };
  } catch (error) {
    console.error('Market data fetch error:', error);
    throw new Error(`Unable to fetch data for ${symbol}. Stock may not exist.`);
  }
}

async function getTechnicalIndicators(symbol: string) {
  try {
    // Get technical indicators from Financial Modeling Prep
    const apiKey = Deno.env.get('FINANCIAL_MODELING_PREP_API_KEY') || 'demo';
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/technical_indicator/daily/${symbol}?period=14&type=rsi&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Technical data for ${symbol} not found`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0 || data.error || data['Error Message']) {
      throw new Error(`Technical data for ${symbol} not found`);
    }
    
    return {
      rsi: data[0]?.rsi || 50,
      trend: data.length > 5 ? 'bullish' : 'bearish',
      support: data[0]?.low || 0,
      resistance: data[0]?.high || 0,
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
