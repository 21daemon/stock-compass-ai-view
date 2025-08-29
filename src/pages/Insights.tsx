
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Zap } from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import { useToast } from '@/components/ui/use-toast';

const Insights = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchMarketOverview } = useStockData();
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];
      const stockData = await fetchMarketOverview(symbols);
      const validStocks = stockData.filter(stock => stock !== null);
      
      if (validStocks.length === 0) {
        setError('Unable to fetch real stock data. Please check API connectivity.');
        setLoading(false);
        toast({
          title: "Data Unavailable",
          description: "Unable to fetch real-time stock data. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const stockInsights = validStocks.map(stock => {
        const sentiment = stock.changePercent > 0 ? 'bullish' : 'bearish';
        const confidence = Math.min(95, Math.max(60, 75 + Math.abs(stock.changePercent) * 2));
        
        return {
          symbol: stock.symbol,
          name: getStockName(stock.symbol),
          sentiment,
          confidence: confidence.toFixed(0),
          price: stock.price,
          change: stock.changePercent,
          analysis: generateAnalysisText(stock.symbol, sentiment, confidence, stock),
          recommendation: generateRecommendation(sentiment, confidence),
          riskLevel: confidence > 80 ? 'Low' : confidence > 65 ? 'Medium' : 'High',
        };
      });
      
      setInsights(stockInsights);
      
      // Calculate market sentiment from real data
      const avgChange = validStocks.reduce((sum, s) => sum + s.changePercent, 0) / validStocks.length;
      const volatility = Math.abs(avgChange);
      
      setMarketSentiment({
        overall: avgChange > 0 ? 'bullish' : 'bearish',
        fearGreedIndex: Math.round(50 + (avgChange * 10)), // Convert to 0-100 scale
        volatility: volatility > 3 ? 'High' : volatility > 1 ? 'Medium' : 'Low',
      });
      
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError('Failed to load market insights. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load market insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, [fetchMarketOverview]);

  const getStockName = (symbol: string) => {
    const names: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
    };
    return names[symbol] || symbol;
  };

  const generateAnalysisText = (symbol: string, sentiment: string, confidence: number, stockData: any) => {
    const priceAction = stockData.changePercent > 0 ? 'gaining' : 'declining';
    const volumeText = stockData.volume > 10000000 ? 'high volume' : 'moderate volume';
    
    const analyses = {
      bullish: [
        `${symbol} is currently ${priceAction} ${Math.abs(stockData.changePercent).toFixed(2)}% with ${volumeText}. Technical indicators suggest continued upward momentum with strong market support.`,
        `Real-time data shows ${symbol} trading at $${stockData.price.toFixed(2)} with positive sentiment. Current price action indicates potential for further gains.`,
        `${symbol} demonstrates strong fundamentals with current price of $${stockData.price.toFixed(2)}. Market data suggests this uptrend may continue.`,
      ],
      bearish: [
        `${symbol} is ${priceAction} ${Math.abs(stockData.changePercent).toFixed(2)}% on ${volumeText}. Technical analysis suggests caution as downward pressure persists.`,
        `Current market data shows ${symbol} at $${stockData.price.toFixed(2)} facing headwinds. Risk management strategies should be considered.`,
        `${symbol} displays weakness with recent price action. At $${stockData.price.toFixed(2)}, the stock may face further challenges in the near term.`,
      ]
    };
    
    return analyses[sentiment as keyof typeof analyses][Math.floor(Math.random() * 3)];
  };

  const generateRecommendation = (sentiment: string, confidence: number) => {
    if (sentiment === 'bullish' && confidence > 75) return 'Strong Buy';
    if (sentiment === 'bullish') return 'Buy';
    if (sentiment === 'bearish' && confidence > 75) return 'Strong Sell';
    if (sentiment === 'bearish') return 'Sell';
    return 'Hold';
  };

  const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
    return sentiment === 'bullish' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const RiskIcon = ({ level }: { level: string }) => {
    if (level === 'Low') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (level === 'Medium') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">AI Market Insights</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get intelligent market analysis powered by advanced AI algorithms and real-time data processing.
        </p>
        <Button onClick={generateInsights} disabled={loading} className="mt-4">
          <Brain className="h-4 w-4 mr-2" />
          {loading ? 'Generating Insights...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Market Sentiment Overview */}
      {marketSentiment && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Market Sentiment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <SentimentIcon sentiment={marketSentiment.overall} />
                  <span className="font-medium capitalize">{marketSentiment.overall}</span>
                </div>
                <div className="text-sm text-muted-foreground">Overall Market</div>
              </div>
              
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <div className="text-2xl font-bold">{marketSentiment.fearGreedIndex}</div>
                <div className="text-sm text-muted-foreground">Fear & Greed Index</div>
                <Badge variant="outline" className="mt-1">
                  {marketSentiment.fearGreedIndex > 50 ? 'Greed' : 'Fear'}
                </Badge>
              </div>
              
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <div className="text-lg font-medium">{marketSentiment.volatility}</div>
                <div className="text-sm text-muted-foreground">Market Volatility</div>
                <Badge 
                  variant={marketSentiment.volatility === 'Low' ? 'default' : 
                          marketSentiment.volatility === 'Medium' ? 'secondary' : 'destructive'}
                  className="mt-1"
                >
                  {marketSentiment.volatility} Risk
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Insights */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Stock Analysis & Recommendations</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <Card key={insight.symbol} className={`animate-fade-in`} style={{ animationDelay: `${index * 200}ms` } as any}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{insight.symbol}</CardTitle>
                    <p className="text-sm text-muted-foreground">{insight.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${insight.price.toFixed(2)}</div>
                    <Badge variant={insight.change >= 0 ? "default" : "destructive"}>
                      {insight.change >= 0 ? '+' : ''}{insight.change.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sentiment & Confidence */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SentimentIcon sentiment={insight.sentiment} />
                    <span className="font-medium capitalize">{insight.sentiment}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className="font-medium">{insight.confidence}%</span>
                  </div>
                </div>

                {/* Risk & Recommendation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RiskIcon level={insight.riskLevel} />
                    <span className="text-sm">{insight.riskLevel} Risk</span>
                  </div>
                  <Badge 
                    variant={
                      insight.recommendation.includes('Buy') ? 'default' :
                      insight.recommendation.includes('Sell') ? 'destructive' : 'secondary'
                    }
                  >
                    {insight.recommendation}
                  </Badge>
                </div>

                {/* Analysis */}
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    AI Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.analysis}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Market Insights */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Key Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-400">Opportunity</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Technology sector showing strong fundamentals with AI-driven companies leading growth. Consider diversified tech exposure.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-400">Watch</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Market volatility expected due to upcoming earnings season. Monitor for sudden price movements and adjust positions accordingly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Disclaimer:</strong> This analysis is for educational and informational purposes only.
            </p>
            <p>
              All predictions and recommendations are generated by AI algorithms and should not be considered as financial advice. 
              Always consult with a qualified financial advisor before making investment decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;
