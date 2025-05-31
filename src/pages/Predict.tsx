
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StockChart from '@/components/StockChart';
import StockCard from '@/components/StockCard';
import { Search, TrendingUp, TrendingDown, Brain, Target } from 'lucide-react';
import { generateCurrentStockPrice, generateStockData, generatePrediction, POPULAR_STOCKS } from '@/utils/stockUtils';
import { toast } from 'sonner';

const Predict = () => {
  const [searchSymbol, setSearchSymbol] = useState('AAPL');
  const [currentStock, setCurrentStock] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [combinedChartData, setCombinedChartData] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchSymbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const stock = generateCurrentStockPrice(searchSymbol.toUpperCase());
      const historical = generateStockData(searchSymbol.toUpperCase(), 30);
      const predicted = generatePrediction(historical, 5);
      
      setCurrentStock(stock);
      setHistoricalData(historical);
      setPredictions(predicted);
      
      // Combine historical and prediction data for chart
      const combined = [
        ...historical,
        ...predicted.map(p => ({
          ...p,
          price: historical[historical.length - 1]?.price || 0, // Keep last actual price
        }))
      ];
      setCombinedChartData(combined);
      
      toast.success(`Analysis complete for ${searchSymbol.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const quickSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META'];
  
  const nextDayPrediction = predictions[0]?.prediction;
  const predictionChange = nextDayPrediction && currentStock ? 
    ((nextDayPrediction - currentStock.price) / currentStock.price) * 100 : 0;
  const isPredictionPositive = predictionChange >= 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">Stock Price Prediction</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enter a stock symbol to get AI-powered price predictions based on historical data and market trends.
        </p>
      </div>

      {/* Search Section */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="uppercase"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Predict'}
            </Button>
          </div>
          
          {/* Quick Access Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2">Quick access:</span>
            {quickSymbols.map(symbol => (
              <Button
                key={symbol}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchSymbol(symbol);
                  setTimeout(handleSearch, 100);
                }}
                className="text-xs"
              >
                {symbol}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Stock Info */}
      {currentStock && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StockCard {...currentStock} />
          </div>
          
          {/* Prediction Summary */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Prediction Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextDayPrediction ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Next Day Prediction</div>
                        <div className="text-2xl font-bold">${nextDayPrediction.toFixed(2)}</div>
                        <Badge variant={isPredictionPositive ? "default" : "destructive"} className="mt-2">
                          {isPredictionPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {isPredictionPositive ? '+' : ''}{predictionChange.toFixed(2)}%
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-sm text-muted-foreground">Confidence Level</div>
                        <div className="text-2xl font-bold">87%</div>
                        <Badge variant="outline" className="mt-2">
                          <Target className="h-3 w-3 mr-1" />
                          High Confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>Analysis:</strong> Based on the last 30 days of price movement and technical indicators, 
                        our AI model predicts a {isPredictionPositive ? 'bullish' : 'bearish'} trend for {currentStock.symbol}. 
                        The prediction takes into account historical volatility, moving averages, and market sentiment.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Search for a stock to see AI predictions
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Chart */}
      {combinedChartData.length > 0 && (
        <div className="animate-slide-up">
          <StockChart 
            data={combinedChartData}
            symbol={currentStock?.symbol || ''}
            showPrediction={true}
            type="line"
          />
        </div>
      )}

      {/* Prediction Details */}
      {predictions.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>5-Day Prediction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {predictions.map((pred, index) => {
                const dayChange = index === 0 ? predictionChange : 
                  ((pred.prediction - predictions[index - 1].prediction) / predictions[index - 1].prediction) * 100;
                const isDayPositive = dayChange >= 0;
                
                return (
                  <div key={index} className="text-center p-4 bg-accent/10 rounded-lg">
                    <div className="text-sm text-muted-foreground">Day {index + 1}</div>
                    <div className="text-lg font-bold">${pred.prediction.toFixed(2)}</div>
                    <Badge 
                      variant={isDayPositive ? "default" : "destructive"} 
                      className="text-xs mt-1"
                    >
                      {isDayPositive ? '+' : ''}{dayChange.toFixed(1)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Predict;
