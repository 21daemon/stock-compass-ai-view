
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PredictionResult {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  predictionDate: string;
}

export const useStockPrediction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrediction = useCallback(async (
    symbol: string,
    currentPrice: number,
    historicalData: number[]
  ): Promise<PredictionResult | null> => {
    try {
      setLoading(true);
      setError(null);

      // Simple prediction algorithm using moving averages and trend analysis
      const prediction = calculateAdvancedPrediction(currentPrice, historicalData);
      
      const predictionData = {
        symbol: symbol.toUpperCase(),
        currentPrice,
        predictedPrice: prediction.price,
        confidence: prediction.confidence,
        predictionDate: new Date().toISOString().split('T')[0],
      };

      // Cache prediction in database
      const { error: dbError } = await supabase
        .from('stock_predictions')
        .upsert(predictionData, {
          onConflict: 'symbol,prediction_date'
        });

      if (dbError) {
        console.warn('Failed to cache prediction:', dbError);
      }

      return {
        ...predictionData,
        predictionDate: predictionData.predictionDate,
      };
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to generate prediction');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCachedPrediction = useCallback(async (symbol: string): Promise<PredictionResult | null> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('stock_predictions')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .eq('prediction_date', today)
        .maybeSingle();

      if (error) {
        console.warn('Failed to fetch cached prediction:', error);
        return null;
      }

      if (!data) return null;

      return {
        symbol: data.symbol,
        currentPrice: parseFloat(data.current_price?.toString() || '0'),
        predictedPrice: parseFloat(data.predicted_price?.toString() || '0'),
        confidence: parseFloat(data.confidence?.toString() || '0'),
        predictionDate: data.prediction_date,
      };
    } catch (err) {
      console.error('Cache fetch error:', err);
      return null;
    }
  }, []);

  return {
    generatePrediction,
    getCachedPrediction,
    loading,
    error,
  };
};

function calculateAdvancedPrediction(currentPrice: number, historicalData: number[]) {
  if (historicalData.length < 5) {
    // Not enough data, return conservative prediction
    return {
      price: currentPrice * (1 + (Math.random() - 0.5) * 0.02), // ±1%
      confidence: 65,
    };
  }

  // Calculate moving averages
  const short_ma = calculateMovingAverage(historicalData.slice(-5), 5);
  const long_ma = calculateMovingAverage(historicalData.slice(-10), 10);
  
  // Calculate volatility
  const returns = historicalData.slice(1).map((price, i) => 
    Math.log(price / historicalData[i])
  );
  const volatility = calculateStandardDeviation(returns);
  
  // Calculate trend
  const trend = calculateLinearTrend(historicalData.slice(-10));
  
  // Simple momentum indicator
  const momentum = (currentPrice - historicalData[Math.max(0, historicalData.length - 5)]) / 
                   historicalData[Math.max(0, historicalData.length - 5)];
  
  // Combine indicators for prediction
  let predictionFactor = 0;
  let confidence = 70;
  
  // Moving average crossover
  if (short_ma > long_ma) {
    predictionFactor += 0.01; // Bullish signal
    confidence += 5;
  } else {
    predictionFactor -= 0.01; // Bearish signal
    confidence += 5;
  }
  
  // Trend following
  predictionFactor += trend * 0.5;
  
  // Momentum
  predictionFactor += momentum * 0.3;
  
  // Volatility adjustment
  const maxChange = Math.min(0.05, volatility * 2); // Cap at 5% change
  predictionFactor = Math.max(-maxChange, Math.min(maxChange, predictionFactor));
  
  // Adjust confidence based on volatility (higher volatility = lower confidence)
  confidence = Math.max(50, Math.min(95, confidence - (volatility * 100)));
  
  return {
    price: currentPrice * (1 + predictionFactor),
    confidence: Math.round(confidence),
  };
}

function calculateMovingAverage(data: number[], period: number): number {
  const relevantData = data.slice(-period);
  return relevantData.reduce((sum, price) => sum + price, 0) / relevantData.length;
}

function calculateStandardDeviation(data: number[]): number {
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / data.length;
  return Math.sqrt(variance);
}

function calculateLinearTrend(data: number[]): number {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope / (sumY / n); // Normalize by average price
}
