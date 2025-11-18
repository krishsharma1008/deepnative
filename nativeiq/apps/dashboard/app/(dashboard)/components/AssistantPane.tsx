"use client";

import { useState, useRef, useEffect } from "react";
import { GlassCard, Badge } from "@nativeiq/ui";

interface AssistantInsight {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  confidence: number;
  impact: "low" | "medium" | "high" | "critical";
  tags: string[];
  relatedTopic: string;
}

interface AssistantPaneProps {
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  userMessage?: string;
  onInsightGenerated?: (insight: any) => void;
}

// Mock initial insights for demonstration - concise and actionable
const INITIAL_INSIGHTS: AssistantInsight[] = [
  {
    id: "insight-1",
    title: "Churn Reduction Strategy",
    content: "Churn at 12% - onboarding friction detected. Implement health scoring system. Target 3% reduction in 30 days.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    confidence: 0.89,
    impact: "high",
    tags: ["churn", "retention"],
    relatedTopic: "customer retention"
  },
  {
    id: "insight-2",
    title: "Cash Flow Optimization",
    content: "2.5 months runway - delay vendor payments 30 days. Invoice financing for faster AR. Reduce marketing spend 40%.",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    confidence: 0.92,
    impact: "critical",
    tags: ["cash flow", "runway"],
    relatedTopic: "financial management"
  }
];

export function AssistantPane({ 
  className, 
  isExpanded = false, 
  onToggleExpand,
  userMessage,
  onInsightGenerated 
}: AssistantPaneProps) {
  const [insights, setInsights] = useState<AssistantInsight[]>(INITIAL_INSIGHTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const insightsEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  const scrollToTop = () => {
    const container = document.querySelector('.assistant-pane__content');
    if (container) {
      container.scrollTop = 0;
    }
  };

  useEffect(() => {
    // Only scroll when we explicitly set the flag during new insight generation
    if (shouldScrollRef.current) {
      scrollToTop();
      shouldScrollRef.current = false;
    }
  }, [insights]);

  // Generate new insight when user message changes
  useEffect(() => {
    if (userMessage && userMessage.trim()) {
      generateInsight(userMessage);
    }
  }, [userMessage]);

  const generateInsight = async (message: string) => {
    setIsGenerating(true);
    shouldScrollRef.current = true; // Enable scroll for this new insight
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    try {
      // Call the AI API for insights
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message, sender: "Alex Martinez" }],
          currentUser: { name: "Alex Martinez", designation: "Founder & CEO" },
          contextData: {
            monthlyRevenue: "$45K MRR",
            customerChurn: "12% monthly churn",
            cashFlow: "2.5 months runway",
            trialConversion: "18% trial-to-paid"
          },
          assistantMode: true // Flag for assistant-specific response
        }),
      });

      let insightContent = "";
      let insightTitle = "";
      
      if (response.ok) {
        const data = await response.json();
        insightContent = data.response || generateFallbackInsight(message);
        insightTitle = generateInsightTitle(data.response || message, message);
      } else {
        insightContent = generateFallbackInsight(message);
        insightTitle = generateInsightTitle(message, message);
      }

      // Check for similar recent insights to avoid duplicates
      const isDuplicate = insights.some(existing => 
        existing.title === insightTitle || 
        existing.content === insightContent ||
        (existing.title.includes('Customer Retention') && insightTitle.includes('Customer Retention'))
      );

      if (isDuplicate) {
        // Modify the insight to make it unique
        const uniqueSuffix = ` (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
        insightTitle = insightTitle.replace(/\([^)]*\)/, '') + uniqueSuffix;
      }

      const newInsight: AssistantInsight = {
        id: `insight-${Date.now()}`,
        title: insightTitle,
        content: insightContent,
        timestamp: new Date(),
        confidence: 0.85 + Math.random() * 0.1,
        impact: determineImpact(insightContent),
        tags: extractTags(message),
        relatedTopic: extractRelatedTopic(message)
      };

      setInsights(prev => [newInsight, ...prev.slice(0, 9)]); // Keep only 10 most recent
      
      // Notify parent component about new insight
      if (onInsightGenerated) {
        onInsightGenerated({
          title: newInsight.title,
          summary: newInsight.content.length > 100 ? newInsight.content.slice(0, 100) + "..." : newInsight.content,
          confidence: newInsight.confidence,
          impact: newInsight.impact,
          source: "AI Assistant Analysis"
        });
      }
      
    } catch (error) {
      console.error('Failed to generate insight:', error);
      
      // Fallback insight
      const fallbackInsight: AssistantInsight = {
        id: `insight-${Date.now()}`,
        title: generateInsightTitle(message, message),
        content: generateFallbackInsight(message),
        timestamp: new Date(),
        confidence: 0.75,
        impact: "medium",
        tags: extractTags(message),
        relatedTopic: extractRelatedTopic(message)
      };
      
      setInsights(prev => [fallbackInsight, ...prev.slice(0, 9)]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackInsight = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Sales-specific insights
    if (lowerMessage.includes('sales') || lowerMessage.includes('selling')) {
      if (lowerMessage.includes('growth')) {
        return 'Sales growth: Focus on high-value prospects. Target 20% pipeline increase in 30 days.';
      }
      if (lowerMessage.includes('pipeline')) {
        return 'Pipeline optimization: Qualify leads better. Reduce sales cycle by 15%.';
      }
      return 'Sales performance: Improve conversion rates. Target 10% increase in close rate.';
    }
    
    // Marketing-specific insights
    if (lowerMessage.includes('marketing') || lowerMessage.includes('campaign')) {
      if (lowerMessage.includes('cost')) {
        return 'Marketing efficiency: Optimize CAC. Target 25% cost reduction per acquisition.';
      }
      return 'Marketing strategy: Focus on high-ROI channels. Increase conversion by 12%.';
    }
    
    // Revenue-specific insights
    if (lowerMessage.includes('revenue') || lowerMessage.includes('mrr')) {
      if (lowerMessage.includes('growth')) {
        return 'Revenue growth: Optimize pricing strategy. Target +15% MRR increase.';
      }
      return 'Revenue stability: Diversify income streams. Reduce dependency on top clients.';
    }
    
    // Churn-specific insights (only if explicitly about churn)
    if (lowerMessage.includes('churn') && (lowerMessage.includes('reduction') || lowerMessage.includes('retention'))) {
      return 'Customer retention: Health scoring + automated outreach. Reduce churn by 3%.';
    }
    
    // Growth and expansion insights
    if (lowerMessage.includes('growth') || lowerMessage.includes('expansion')) {
      return 'Growth strategy: Prioritize high-ROI channels. Maintain unit economics.';
    }
    
    // Team and productivity insights
    if (lowerMessage.includes('team') || lowerMessage.includes('productivity')) {
      return 'Team efficiency: Optimize workload distribution. Prevent burnout.';
    }
    
    // Cash flow and financial insights
    if (lowerMessage.includes('cash') || lowerMessage.includes('runway') || lowerMessage.includes('financial')) {
      return 'Cash flow: Payment terms optimization + expense prioritization.';
    }
    
    // Customer experience insights
    if (lowerMessage.includes('customer') || lowerMessage.includes('satisfaction')) {
      return 'CX improvement: Feedback loops + personalized engagement.';
    }
    
    // Competitive insights
    if (lowerMessage.includes('competition') || lowerMessage.includes('competitive')) {
      return 'Competitive edge: Unique value props + customer success focus.';
    }
    
    // Product insights
    if (lowerMessage.includes('product') || lowerMessage.includes('feature')) {
      return 'Product strategy: Focus on user feedback. Prioritize high-impact features.';
    }
    
    // Generic strategic insight
    return 'Strategic focus: Implement data-driven decisions with clear metrics. Start with 1-2 actionable items this week.';
  };

  const generateInsightTitle = (content: string, originalMessage?: string): string => {
    // Use original message for better context if available
    const contextText = originalMessage || content;
    const lowerContent = contextText.toLowerCase();
    
    // Sales-specific titles (check first to avoid churn override)
    if (lowerContent.includes('sales') || lowerContent.includes('selling') || lowerContent.includes('revenue growth')) {
      if (lowerContent.includes('growth') || lowerContent.includes('increase')) {
        return "Sales Growth Strategy";
      }
      if (lowerContent.includes('pipeline') || lowerContent.includes('leads')) {
        return "Sales Pipeline Optimization";
      }
      if (lowerContent.includes('conversion') || lowerContent.includes('close')) {
        return "Sales Conversion Enhancement";
      }
      return "Sales Performance Analysis";
    }
    
    // Marketing-specific titles
    if (lowerContent.includes('marketing') || lowerContent.includes('campaign') || lowerContent.includes('acquisition')) {
      if (lowerContent.includes('cost') || lowerContent.includes('cac')) {
        return "Marketing Cost Optimization";
      }
      if (lowerContent.includes('channel') || lowerContent.includes('roi')) {
        return "Marketing Channel Analysis";
      }
      return "Marketing Strategy Review";
    }
    
    // Churn-specific titles (only if explicitly about churn)
    if (lowerContent.includes('churn') && (lowerContent.includes('reduction') || lowerContent.includes('retention'))) {
      const churnMatch = content.match(/(\d+)%/);
      if (churnMatch) {
        return `Churn Reduction Strategy (${churnMatch[1]}% → Target)`;
      }
      return "Customer Retention Strategy";
    }
    
    // Revenue-specific titles
    if (lowerContent.includes('revenue') || lowerContent.includes('mrr')) {
      if (lowerContent.includes('growth') || lowerContent.includes('increase')) {
        return "Revenue Growth Optimization";
      }
      if (lowerContent.includes('stability') || lowerContent.includes('stabilize')) {
        return "Revenue Stability Plan";
      }
      return "Revenue Performance Analysis";
    }
    
    // Cash flow and financial titles
    if (lowerContent.includes('cash') || lowerContent.includes('runway') || lowerContent.includes('financial')) {
      const runwayMatch = content.match(/(\d+\.?\d*)\s*months?/);
      if (runwayMatch) {
        return `Cash Flow Optimization (${runwayMatch[1]}m runway)`;
      }
      return "Financial Health Assessment";
    }
    
    // Team and productivity titles
    if (lowerContent.includes('team') || lowerContent.includes('productivity') || lowerContent.includes('workforce')) {
      return "Team Performance Enhancement";
    }
    
    // Growth and expansion titles
    if (lowerContent.includes('growth') || lowerContent.includes('expansion') || lowerContent.includes('scale')) {
      return "Growth Acceleration Strategy";
    }
    
    // Competitive and market titles
    if (lowerContent.includes('competition') || lowerContent.includes('market') || lowerContent.includes('competitive')) {
      return "Competitive Positioning Analysis";
    }
    
    // Customer experience titles
    if (lowerContent.includes('customer') || lowerContent.includes('satisfaction') || lowerContent.includes('experience')) {
      return "Customer Experience Optimization";
    }
    
    // Product and feature titles
    if (lowerContent.includes('product') || lowerContent.includes('feature') || lowerContent.includes('development')) {
      return "Product Strategy Review";
    }
    
    // Operations and efficiency titles
    if (lowerContent.includes('operation') || lowerContent.includes('efficiency') || lowerContent.includes('process')) {
      return "Operational Excellence Review";
    }
    
    // Generate unique titles based on content hash for truly generic content
    const contentHash = contextText.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const dynamicTitles = [
      "Strategic Business Analysis",
      "Performance Optimization Review", 
      "Risk Assessment & Mitigation",
      "Revenue Enhancement Plan",
      "Operational Efficiency Review",
      "Customer Success Initiative",
      "Financial Performance Insights",
      "Market Opportunity Analysis",
      "Business Intelligence Report",
      "Strategic Recommendation"
    ];
    
    return dynamicTitles[Math.abs(contentHash) % dynamicTitles.length];
  };

  const determineImpact = (content: string): "low" | "medium" | "high" | "critical" => {
    const lowerContent = content.toLowerCase();
    
    // Critical: Immediate business threats or urgent financial issues
    const criticalKeywords = ["critical", "urgent", "immediate", "crisis", "runway", "cash flow", "months", "burn"];
    const criticalPatterns = [/\d+\.?\d*\s*months?/, /runway/, /burn\s*rate/];
    
    if (criticalKeywords.some(keyword => lowerContent.includes(keyword)) ||
        criticalPatterns.some(pattern => pattern.test(content))) {
      return "critical";
    }
    
    // High: Significant business metrics or growth opportunities
    const highKeywords = ["churn", "revenue", "growth", "mrr", "ltv", "conversion", "retention"];
    const highPatterns = [/\d+%/, /increase/, /reduce/, /target/];
    
    if (highKeywords.some(keyword => lowerContent.includes(keyword)) ||
        highPatterns.some(pattern => pattern.test(content))) {
      return "high";
    }
    
    // Medium: Optimization and improvement opportunities
    const mediumKeywords = ["optimize", "improve", "enhance", "strategy", "plan", "recommend"];
    
    if (mediumKeywords.some(keyword => lowerContent.includes(keyword))) {
      return "medium";
    }
    
    // Low: General insights or analysis
    return "low";
  };

  const extractTags = (message: string): string[] => {
    const lowerMessage = message.toLowerCase();
    const tags: string[] = [];
    
    // More specific and contextual tag extraction
    if (lowerMessage.includes('churn') || lowerMessage.includes('retention')) {
      tags.push('retention');
      if (lowerMessage.includes('onboarding')) tags.push('onboarding');
      if (lowerMessage.includes('health')) tags.push('health-scoring');
    }
    
    if (lowerMessage.includes('revenue') || lowerMessage.includes('mrr')) {
      tags.push('revenue');
      if (lowerMessage.includes('growth')) tags.push('growth');
      if (lowerMessage.includes('optimization')) tags.push('optimization');
    }
    
    if (lowerMessage.includes('cash') || lowerMessage.includes('runway')) {
      tags.push('cash-flow');
      if (lowerMessage.includes('vendor')) tags.push('vendor-management');
      if (lowerMessage.includes('financing')) tags.push('financing');
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('productivity')) {
      tags.push('team');
      if (lowerMessage.includes('workload')) tags.push('workload');
      if (lowerMessage.includes('burnout')) tags.push('wellbeing');
    }
    
    if (lowerMessage.includes('customer') || lowerMessage.includes('satisfaction')) {
      tags.push('customer');
      if (lowerMessage.includes('feedback')) tags.push('feedback');
      if (lowerMessage.includes('experience')) tags.push('cx');
    }
    
    if (lowerMessage.includes('competition') || lowerMessage.includes('market')) {
      tags.push('competitive');
      if (lowerMessage.includes('positioning')) tags.push('positioning');
      if (lowerMessage.includes('advantage')) tags.push('advantage');
    }
    
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost')) {
      tags.push('pricing');
    }
    
    if (lowerMessage.includes('marketing') || lowerMessage.includes('acquisition')) {
      tags.push('marketing');
    }
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('conversion')) {
      tags.push('sales');
    }
    
    // Add contextual tags based on content analysis
    if (lowerMessage.includes('urgent') || lowerMessage.includes('immediate')) {
      tags.push('urgent');
    }
    
    if (lowerMessage.includes('metric') || lowerMessage.includes('%')) {
      tags.push('metrics');
    }
    
    if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
      tags.push('strategy');
    }
    
    // Ensure we have at least 1-2 meaningful tags, avoid generic fallbacks
    if (tags.length === 0) {
      // Generate contextual tags based on message content hash
      const contentHash = message.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const contextualTags = [
        ['analysis', 'insights'],
        ['optimization', 'efficiency'],
        ['strategy', 'planning'],
        ['performance', 'metrics'],
        ['growth', 'expansion']
      ];
      
      const selectedTags = contextualTags[Math.abs(contentHash) % contextualTags.length];
      tags.push(...selectedTags);
    }
    
    return tags.slice(0, 3); // Limit to 3 most relevant tags
  };

  const extractRelatedTopic = (message: string): string => {
    const topics = ['revenue', 'churn', 'growth', 'team', 'customer', 'financial'];
    const lowerMessage = message.toLowerCase();
    
    for (const topic of topics) {
      if (lowerMessage.includes(topic)) {
        return topic;
      }
    }
    
    return 'strategic planning';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'critical';
      case 'high': return 'warning';  
      case 'medium': return 'info';
      default: return 'muted';
    }
  };

  return (
    <div className={`assistant-pane ${isExpanded ? 'assistant-pane--expanded' : ''} ${className || ""}`}>
      <GlassCard className="assistant-pane__container">
        {/* Custom Header matching Key Business Insights style */}
        <div className="assistant-pane-header">
          <div className="assistant-pane-title-section">
            <h3 className="assistant-pane-title">Assistant Pane</h3>
            <p className="assistant-pane-caption">Real-time business insights for Alex Martinez</p>
          </div>
          <div className="assistant-pane-controls">
            <Badge tone="info" className="assistant-pane-status">
              {insights.length} insights
            </Badge>
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="assistant-pane-expand-btn"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? "⊟" : "⊞"}
              </button>
            )}
          </div>
        </div>

        {/* Insights List */}
        <div className="assistant-pane__content">

          {isGenerating && (
            <div className="assistant-insight assistant-insight--generating">
              <div className="assistant-insight__header">
                <div className="assistant-insight__meta">
                  <span className="assistant-insight__status">🧠 Analyzing...</span>
                  <span className="assistant-insight__timestamp">Now</span>
                </div>
              </div>
              <div className="assistant-thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="assistant-insight__generating-text">
                Generating strategic insights based on your message...
              </div>
            </div>
          )}

          {insights.map((insight) => (
            <div key={insight.id} className="assistant-insight">
              <div className="assistant-insight__header">
                <div className="assistant-insight__meta">
                  <Badge tone={getImpactColor(insight.impact)} className="assistant-insight__impact">
                    {insight.impact}
                  </Badge>
                  <span className="assistant-insight__confidence">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                  <span className="assistant-insight__timestamp">
                    {formatTime(insight.timestamp)}
                  </span>
                </div>
              </div>
              
              <h4 className="assistant-insight__title">{insight.title}</h4>
              
              <p className="assistant-insight__content">
                {insight.content}
              </p>
              
              {insight.tags.length > 0 && (
                <div className="assistant-insight__tags">
                  {insight.tags.map((tag, index) => (
                    <span key={index} className="assistant-insight__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {insights.length === 0 && !isGenerating && (
            <div className="assistant-pane__empty">
              <div className="assistant-pane__empty-icon">💡</div>
              <div className="assistant-pane__empty-text">
                <h4>Ready to assist</h4>
                <p>Send a message in the chat to get AI-powered business insights and recommendations.</p>
              </div>
            </div>
          )}
          
          <div ref={insightsEndRef} />
        </div>
      </GlassCard>
    </div>
  );
}

export default AssistantPane;

// Content spacing fix - no overlap with header
