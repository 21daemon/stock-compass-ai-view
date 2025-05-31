
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Zap } from 'lucide-react';
import { generateCurrentStockPrice, POPULAR_STOCKS } from '@/utils/stockUtils';

const Insights = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = () => {
    setLoading(true);
    
    setTimeout(() => {
      const stockInsights = POPULAR_STOCKS.slice(0, 4).map(stock => {
        const data = generateCurrentStockPrice(stock.symbol);
        const sentiment = Math.random() > 0.5 ? 'bullish' : 'bearish';
        const confidence = 60 + Math.random() * 35; // 60-95%
        
        return {
          symbol: stock.symbol,
          name: stock.name,
          sentiment,
          confidence: confidence.toFixed(0),
          price: data.price,
          change: data.changePercent,
          analysis: generateAnalysisText(stock.symbol, sentiment, confidence),
          recommendation: generateRecommendation(sentiment, confidence),
          riskLevel: confidence > 80 ? 'Low' : confidence > 60 ? 'Medium' : 'High',
        };
      });
      
      setInsights(stockInsights);
      setMarketSentiment({
        overall: Math.random() > 0.6 ? 'bullish' : 'bearish',
        fearGreedIndex: Math.floor(20 + Math.random() * 60), // 20-80
        volatility: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      });
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    generateInsights();
  }, []);

  const generateAnalysisText = (symbol: string, sentiment: string, confidence: number) => {
    const analyses = {
      bullish: [
        `Strong technical indicators suggest ${symbol} is positioned for growth. Recent earnings beat expectations and institutional buying has increased.`,
        `${symbol} shows strong momentum with rising volume and positive price action. Market sentiment remains optimistic.`,
        `Technical analysis reveals ${symbol} breaking through key resistance levels. Fundamental analysis supports continued growth.`,
      ],
      bearish: [
        `${symbol} faces headwinds with declining volume and weak technical indicators. Consider caution in the near term.`,
        `Market sentiment for ${symbol} has turned negative with concerns about valuation and competitive pressures.`,
        `${symbol} shows signs of weakness with lower highs and declining support levels. Risk management is advised.`,
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
