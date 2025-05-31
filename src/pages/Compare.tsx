
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StockChart from '@/components/StockChart';
import { X, Plus, TrendingUp, TrendingDown, GitCompare } from 'lucide-react';
import { generateCurrentStockPrice, generateStockData, generatePrediction } from '@/utils/stockUtils';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Compare = () => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const colors = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#10b981', '#f59e0b', '#8b5cf6'];

  const addStock = async () => {
    if (!newSymbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    if (stocks.length >= 5) {
      toast.error('Maximum 5 stocks can be compared');
      return;
    }

    if (stocks.some(s => s.symbol === newSymbol.toUpperCase())) {
      toast.error('Stock already added');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stock = generateCurrentStockPrice(newSymbol.toUpperCase());
      const historical = generateStockData(newSymbol.toUpperCase(), 30);
      const predictions = generatePrediction(historical, 5);
      
      const stockWithData = {
        ...stock,
        historical,
        predictions,
        color: colors[stocks.length],
      };
      
      setStocks(prev => [...prev, stockWithData]);
      setNewSymbol('');
      toast.success(`${newSymbol.toUpperCase()} added to comparison`);
    } catch (error) {
      toast.error('Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  };

  const removeStock = (symbol: string) => {
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
    toast.success(`${symbol} removed from comparison`);
  };

  // Prepare normalized chart data for comparison
  useEffect(() => {
    if (stocks.length === 0) {
      setChartData([]);
      return;
    }

    // Get the longest historical data length
    const maxLength = Math.max(...stocks.map(s => s.historical.length));
    
    // Create normalized data (percentage change from first day)
    const normalized: any[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const dataPoint: any = { time: '' };
      
      stocks.forEach(stock => {
        if (stock.historical[i]) {
          const firstPrice = stock.historical[0].price;
          const currentPrice = stock.historical[i].price;
          const percentChange = ((currentPrice - firstPrice) / firstPrice) * 100;
          
          dataPoint.time = stock.historical[i].time;
          dataPoint[stock.symbol] = percentChange;
        }
      });
      
      if (dataPoint.time) normalized.push(dataPoint);
    }
    
    setChartData(normalized);
  }, [stocks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {`${pld.dataKey}: ${pld.value > 0 ? '+' : ''}${pld.value.toFixed(2)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Load default stocks
  useEffect(() => {
    const loadDefaults = async () => {
      const defaultSymbols = ['AAPL', 'GOOGL'];
      for (const symbol of defaultSymbols) {
        setNewSymbol(symbol);
        await new Promise(resolve => setTimeout(resolve, 100));
        await addStock();
      }
    };
    
    if (stocks.length === 0) {
      loadDefaults();
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">Stock Comparison</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compare multiple stocks side by side to analyze their performance and predictions.
        </p>
      </div>

      {/* Add Stock Section */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Stock to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter stock symbol (e.g., TSLA)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
              className="uppercase"
            />
            <Button onClick={addStock} disabled={isLoading || stocks.length >= 5}>
              {isLoading ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Maximum 5 stocks can be compared. Currently: {stocks.length}/5
          </p>
        </CardContent>
      </Card>

      {/* Stock Cards */}
      {stocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock, index) => (
            <Card key={stock.symbol} className="relative animate-fade-in">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removeStock(stock.symbol)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stock.color }}
                  />
                  <CardTitle className="text-lg">{stock.symbol}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">${stock.price.toFixed(2)}</span>
                  <Badge variant={stock.change >= 0 ? "default" : "destructive"}>
                    {stock.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {stock.changePercent.toFixed(2)}%
                  </Badge>
                </div>
                
                {stock.prediction && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI Prediction:</span>
                      <span className="font-medium">${stock.prediction.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Chart */}
      {chartData.length > 0 && stocks.length > 1 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Performance Comparison (Normalized %)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value.toFixed(1)}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {stocks.map((stock) => (
                    <Line
                      key={stock.symbol}
                      type="monotone"
                      dataKey={stock.symbol}
                      stroke={stock.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: stock.color, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side by Side Charts */}
      {stocks.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Individual Stock Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stocks.map((stock) => (
              <div key={stock.symbol} className="animate-fade-in">
                <StockChart
                  data={stock.historical}
                  symbol={stock.symbol}
                  showPrediction={false}
                  type="area"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {stocks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No stocks to compare</h3>
            <p className="text-muted-foreground">Add at least two stocks to start comparing their performance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Compare;
