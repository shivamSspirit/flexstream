'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { MinimalSidebar } from '@/components/layout/MinimalSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  FireIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const stats = [
    {
      label: '24h Volume',
      value: '$2.3M',
      change: '+12.5%',
      trend: 'up',
      icon: CurrencyDollarIcon,
    },
    {
      label: 'Active Traders',
      value: '15.2K',
      change: '+8.2%',
      trend: 'up',
      icon: UsersIcon,
    },
    {
      label: 'Total Trades',
      value: '45.8K',
      change: '+5.7%',
      trend: 'up',
      icon: ChartBarIcon,
    },
    {
      label: 'Hot Tokens',
      value: '128',
      change: '-2.3%',
      trend: 'down',
      icon: FireIcon,
    },
  ];

  const recentTrades = [
    { token: 'BONK', price: '$0.000034', change: '+12.5%', volume: '$2.4M', time: '2m ago' },
    { token: 'PEPE', price: '$0.000012', change: '+8.2%', volume: '$1.8M', time: '5m ago' },
    { token: 'WIF', price: '$1.234', change: '-3.1%', volume: '$3.2M', time: '12m ago' },
    { token: 'SAMO', price: '$0.056', change: '+15.7%', volume: '$890K', time: '18m ago' },
  ];

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Minimal Sidebar */}
      <MinimalSidebar />

      {/* Main Content with Universal Header */}
      <div className="sm:pl-16 md:pl-20">
        {/* Universal Header */}
        <UniversalHeader
          onMenuClick={() => setMenuOpen(!menuOpen)}
          showWallet={true}
          showSearch={true}
        />

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Trading Dashboard</h1>
            <p className="text-secondary">Monitor your portfolio and market trends</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="bg-card-bg border-white/10 hover:border-white/20 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-secondary" />
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        stat.trend === 'up'
                          ? 'bg-metric-green/10 text-metric-green border-metric-green/30'
                          : 'bg-metric-red/10 text-metric-red border-metric-red/30'
                      )}
                    >
                      {stat.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
                      )}
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-secondary">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Trades Table */}
          <Card className="bg-card-bg border-white/10">
            <CardHeader>
              <CardTitle className="text-primary">Recent Trades</CardTitle>
              <CardDescription className="text-secondary">
                Live trading activity across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrades.map((trade, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-app-bg/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {trade.token[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-primary font-semibold">{trade.token}</div>
                        <div className="text-secondary text-sm">{trade.time}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-primary font-medium">{trade.price}</div>
                        <div className="text-secondary text-sm">Price</div>
                      </div>

                      <div className="text-right">
                        <div
                          className={cn(
                            'font-semibold',
                            trade.change.startsWith('+')
                              ? 'text-metric-green'
                              : 'text-metric-red'
                          )}
                        >
                          {trade.change}
                        </div>
                        <div className="text-secondary text-sm">24h</div>
                      </div>

                      <div className="text-right">
                        <div className="text-link-blue font-medium">{trade.volume}</div>
                        <div className="text-secondary text-sm">Volume</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-64 bg-card-bg border-l border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-primary font-bold text-lg">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                className="text-secondary hover:text-primary"
              >
                <Bars3Icon className="w-6 h-6" />
              </Button>
            </div>

            <nav className="space-y-2">
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Trading', path: '/trading' },
                { label: 'Portfolio', path: '/portfolio' },
                { label: 'Analytics', path: '/analytics' },
                { label: 'Settings', path: '/settings' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-secondary hover:text-primary hover:bg-app-bg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

