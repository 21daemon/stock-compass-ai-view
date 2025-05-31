
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StockCard from '@/components/StockCard';
import StockChart from '@/components/StockChart';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { generateCurrentStockPrice, generateStockData, generateMarketOverview, POPULAR_STOCKS } from '@/utils/stockUtils';
import { cn } from '@/lib/utils';

const Home = () => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any>(null);
  const [featuredStock, setFeaturedStock] = useState<any>(null);
  const [featuredChartData, setFeaturedChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate stock data
    const stockData = POPULAR_STOCKS.slice(0, 6).map(stock => generateCurrentStockPrice(stock.symbol));
    setStocks(stockData);
    
    // Generate market overview
    setMarketData(generateMarketOverview());
    
    // Set featured stock (AAPL)
    const featured = generateCurrentStockPrice('AAPL');
    setFeaturedStock(featured);
    setFeaturedChartData(generateStockData('AAPL', 30));
  }, []);

  const MarketOverviewCard = ({ title, value, change, icon: Icon }: any) => {
    const isPositive = change >= 0;
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{title}</span>
            </div>
            <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </Badge>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{value.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          AI-Powered Stock Prediction
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Harness the power of artificial intelligence to predict stock market movements and make informed investment decisions.
        </p>
      </div>

      {/* Market Overview */}
      {marketData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MarketOverviewCard
            title="S&P 500"
            value={marketData.sp500.value}
            change={marketData.sp500.change}
            icon={TrendingUp}
          />
          <MarketOverviewCard
            title="NASDAQ"
            value={marketData.nasdaq.value}
            change={marketData.nasdaq.change}
            icon={BarChart3}
          />
          <MarketOverviewCard
            title="Dow Jones"
            value={marketData.dow.value}
            change={marketData.dow.change}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Featured Stock Chart */}
      {featuredStock && featuredChartData.length > 0 && (
        <div className="animate-slide-up">
          <StockChart 
            data={featuredChartData} 
            symbol={featuredStock.symbol}
            showPrediction={false}
            type="area"
          />
        </div>
      )}

      {/* Popular Stocks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular Stocks</h2>
          <Badge variant="outline" className="text-sm">
            Live Data Simulation
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock, index) => (
            <StockCard
              key={stock.symbol}
              {...stock}
              className={`animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` } as any}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4 animate-fade-in">
          <div className="text-2xl font-bold text-primary">95%</div>
          <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
        </Card>
        <Card className="text-center p-4 animate-fade-in">
          <div className="text-2xl font-bold text-primary">500+</div>
          <div className="text-sm text-muted-foreground">Stocks Analyzed</div>
        </Card>
        <Card className="text-center p-4 animate-fade-in">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-sm text-muted-foreground">Real-time Updates</div>
        </Card>
        <Card className="text-center p-4 animate-fade-in">
          <div className="text-2xl font-bold text-primary">AI</div>
          <div className="text-sm text-muted-foreground">Powered Insights</div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
