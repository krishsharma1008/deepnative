"use client";

import { useState, useEffect } from "react";
import type { Approval, Insight, Task, SlaMetric } from "@nativeiq/types";
import { CommandPalette, useTheme } from "@nativeiq/ui";
import { ChatInterface } from "./ChatInterface";
import { RoleDashboard } from "./RoleDashboard";
import { GlassCard, Badge, Button } from "@nativeiq/ui";
import MarketSuggestions from "./market/MarketSuggestions";
import AssistantPane from "./AssistantPane";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string;
  designation: string;
  department: string;
  avatar?: string;
  color: string;
}

// User profiles for SMB demonstration
const USER_PROFILES: UserProfile[] = [
  {
    id: "user1",
    name: "Alex Martinez",
    designation: "Founder & CEO",
    department: "Leadership",
    avatar: "👨‍💼",
    color: "#3B82F6"
  },
  {
    id: "user2",
    name: "Jamie Wilson",
    designation: "Operations Lead",
    department: "Operations",
    avatar: "👩‍💼",
    color: "#8B5CF6"
  },
  {
    id: "user3",
    name: "Taylor Brooks",
    designation: "Customer Success",
    department: "Support",
    avatar: "👩‍💻",
    color: "#06B6D4"
  },
  {
    id: "user4",
    name: "Jordan Lee",
    designation: "Sales Manager",
    department: "Sales",
    avatar: "👨‍🚀",
    color: "#0EA5E9"
  }
];

type SplitScreenLayoutProps = {
  insights: Insight[];
  tasks: Task[];
  approvals: Approval[];
  slaMetrics: SlaMetric[];
};

export default function SplitScreenLayout({ insights, tasks, approvals, slaMetrics }: SplitScreenLayoutProps) {
  const { mode, setMode } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [liveInsights, setLiveInsights] = useState(insights);
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES[0]);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [expandedExecutiveDashboard, setExpandedExecutiveDashboard] = useState(false);
  const [expandedMarketSuggestions, setExpandedMarketSuggestions] = useState(false);
  const [expandedAssistant, setExpandedAssistant] = useState(false);
  const [expandedDashboard, setExpandedDashboard] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    // Read company name from localStorage
    if (typeof window !== 'undefined') {
      const storedCompany = localStorage.getItem("nativeiq_company");
      setCompanyName(storedCompany || "IQ");
    }
  }, []);

  const handleInsightGenerated = (newInsight: any) => {
    const insight: Insight = {
      id: `insight-chat-${Date.now()}`,
      type: "summary" as const,
      title: newInsight.title,
      summary: newInsight.summary,
      confidence: newInsight.confidence,
      impact: "medium" as const,
      owner: "AI Analysis",
      sources: [{
        label: newInsight.source || "Team Chat",
        url: "#",
        timestamp: new Date().toISOString()
      }],
      suggestedActions: []
    };
    
    setLiveInsights(prev => [insight, ...prev.slice(0, 4)]); // Keep only 5 most recent
  };

  // Handler for when Alex Martinez (central user) sends a message
  const handleUserMessage = (message: string, user: UserProfile) => {
    // Only trigger assistant response for Alex Martinez (the central user)
    if (user.name === "Alex Martinez") {
      setLastUserMessage(message);
    }
  };

  const commands = [
    {
      id: "command-open-command-center",
      title: "Run automation",
      subtitle: "Trigger a policy-approved MCP workflow",
      shortcut: "g+a"
    },
    {
      id: "command-share-insight",
      title: "Share latest risk insight",
      subtitle: liveInsights[0]?.title ?? "",
      shortcut: "s+i"
    },
    {
      id: "command-open-approvals",
      title: "Jump to approvals queue",
      shortcut: "g+q"
    }
  ];

  return (
    <div className="magical-shell" role="application">
      {/* Magical Background Effects */}
      <div className="magical-bg">
        <div className="magical-orb magical-orb--1"></div>
        <div className="magical-orb magical-orb--2"></div>
        <div className="magical-orb magical-orb--3"></div>
        <div className="magical-particles"></div>
      </div>

      {/* Header with Navigation */}
      <header className="magical-header">
        <div className="magical-header__brand">
          <div className="magical-logo">
            <Image 
              src="/logo.png" 
              alt="Native Logo" 
              width={28}
              height={28}
              style={{ 
                marginRight: '8px',
                verticalAlign: 'middle'
              }} 
            />
            <span>{companyName}: Native</span>
          </div>
          <div className="magical-tagline">Intelligent Business Insights</div>
        </div>
        <div className="magical-header__user">
          <button
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className="magical-theme-toggle"
            title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
          >
            {mode === "dark" ? "🌙" : "☀️"}
          </button>
          <div className="magical-user-selector">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = USER_PROFILES.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="magical-select"
            >
              {USER_PROFILES.map(user => (
                <option key={user.id} value={user.id}>
                  {user.avatar} {user.name} - {user.designation}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area - Chat Left, Assistant+Dashboard Right */}
      <main className="magical-content new-three-pane">
        {/* Chat Pane - Left Half */}
        <div className="magical-content__chat">
          <ChatInterface
            className="magical-chat"
            onInsightGenerated={handleInsightGenerated}
            onUserChange={setCurrentUser}
            onUserMessage={handleUserMessage}
            currentUser={currentUser}
          />
        </div>

        {/* Right Side Container */}
        <div className="magical-content__right-side">
          {/* Assistant Pane - Top Right */}
          <div className={`magical-content__assistant ${expandedAssistant ? 'expanded' : ''}`}>
            <AssistantPane
              className="magical-assistant"
              isExpanded={expandedAssistant}
              onToggleExpand={() => setExpandedAssistant(!expandedAssistant)}
              userMessage={lastUserMessage}
              onInsightGenerated={handleInsightGenerated}
            />
          </div>

          {/* Dashboard Pane - Bottom Right */}
          <div className={`magical-content__dashboard ${expandedDashboard ? 'expanded' : ''}`}>
            <GlassCard 
              title="Key Business Insights" 
              caption="Executive dashboard for Alex Martinez"
              className="dashboard-pane-card"
              actionSlot={
                <div className="dashboard-pane-controls">
                  <Badge tone="info" className="dashboard-pane-status">
                    {liveInsights.length} insights
                  </Badge>
                  <button
                    onClick={() => setExpandedMarketSuggestions(!expandedMarketSuggestions)}
                    className="dashboard-pane-market-btn"
                    title="Open Market Insights"
                  >
                    📊 Market
                  </button>
                  <button
                    onClick={() => setExpandedDashboard(!expandedDashboard)}
                    className="dashboard-pane-expand-btn"
                    title={expandedDashboard ? "Collapse" : "Expand"}
                  >
                    {expandedDashboard ? "⊟" : "⊞"}
                  </button>
                </div>
              }
            >
              <div className="dashboard-pane-content">
                {/* Key Metrics Overview */}
                <div className="key-metrics-overview">
                  <div className="key-metric-item critical">
                    <div className="key-metric-icon">🔥</div>
                    <div className="key-metric-details">
                      <div className="key-metric-label">Cash Runway</div>
                      <div className="key-metric-value">2.5 months</div>
                    </div>
                  </div>
                  
                  <div className="key-metric-item warning">
                    <div className="key-metric-icon">📊</div>
                    <div className="key-metric-details">
                      <div className="key-metric-label">Churn Rate</div>
                      <div className="key-metric-value">12%</div>
                    </div>
                  </div>
                  
                  <div className="key-metric-item info">
                    <div className="key-metric-icon">💰</div>
                    <div className="key-metric-details">
                      <div className="key-metric-label">MRR</div>
                      <div className="key-metric-value">$45K</div>
                    </div>
                  </div>
                </div>

                {/* Recent Insights */}
                <div className="dashboard-insights-section">
                  <h4 className="dashboard-insights-title">Recent Strategic Insights</h4>
                  <div className="dashboard-insights-list">
                    {liveInsights.slice(0, 3).map((insight) => (
                      <div key={insight.id} className="dashboard-insight-item">
                        <div className="dashboard-insight-header">
                          <Badge tone={insight.impact === 'critical' ? 'critical' : insight.impact === 'high' ? 'warning' : 'muted'}>
                            {insight.impact}
                          </Badge>
                          <span className="dashboard-insight-confidence">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                        <h5 className="dashboard-insight-title">{insight.title}</h5>
                        <p className="dashboard-insight-summary">{insight.summary}</p>
                      </div>
                    ))}
                    
                    {liveInsights.length === 0 && (
                      <div className="dashboard-insights-empty">
                        <p>📈 Strategic insights will appear here as conversations develop</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-actions-section">
                  <h4 className="dashboard-actions-title">Quick Actions</h4>
                  <div className="dashboard-actions-grid">
                    <button className="dashboard-action-btn critical">
                      <span className="dashboard-action-icon">🚨</span>
                      <span className="dashboard-action-text">Review Cash Flow</span>
                    </button>
                    <button className="dashboard-action-btn warning">
                      <span className="dashboard-action-icon">📞</span>
                      <span className="dashboard-action-text">Customer Calls</span>
                    </button>
                    <button className="dashboard-action-btn info">
                      <span className="dashboard-action-icon">📈</span>
                      <span className="dashboard-action-text">Growth Strategy</span>
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Market Suggestions Panel */}
        {expandedMarketSuggestions && (
          <div className="market-suggestions-panel">
            <GlassCard
              title="Market Insights"
              caption="Industry trends and market intelligence"
              className="market-suggestions-card"
            >
              <MarketSuggestions onClose={() => setExpandedMarketSuggestions(false)} />
            </GlassCard>
          </div>
        )}
      </main>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={commands}
        query={query}
        onQueryChange={setQuery}
      />
    </div>
  );
}
