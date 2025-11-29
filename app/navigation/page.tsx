'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HomeIcon,
  UserIcon,
  PlusIcon,
  PlayIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

export default function NavigationPage() {
  const router = useRouter();

  const navigationRoutes = [
    {
      category: "Main App",
      routes: [
        { name: "Landing Page", path: "/", description: "Home page with FlexIt branding", icon: HomeIcon, color: "text-emerald-400" },
        { name: "Feed", path: "/feed", description: "Social feed like Zora", icon: SignalIcon, color: "text-purple-400" },
        { name: "Demo", path: "/demo", description: "Live demo with sample content", icon: PlayIcon, color: "text-blue-400" },
        { name: "Creator Journey", path: "/demo-flow", description: "How creators use FlexIt", icon: ChartBarIcon, color: "text-cyan-400" },
      ]
    },
    {
      category: "Authentication",
      routes: [
        { name: "Sign Up", path: "/auth/signup", description: "Create new account", icon: UserIcon, color: "text-green-400" },
        { name: "Sign In", path: "/auth/signin", description: "Login to existing account", icon: UserIcon, color: "text-green-400" },
        { name: "Onboarding", path: "/auth/onboarding", description: "Complete your profile setup", icon: CogIcon, color: "text-orange-400" },
      ]
    },
    {
      category: "Creator Features",
      routes: [
        { name: "Create Post", path: "/create", description: "Share your trading wins", icon: PlusIcon, color: "text-purple-400" },
        { name: "Profile", path: "/profile", description: "View your profile and stats", icon: UserIcon, color: "text-emerald-400" },
        { name: "Edit Profile", path: "/profile/edit", description: "Update your profile info", icon: CogIcon, color: "text-cyan-400" },
      ]
    },
          {
            category: "Pump.fun Integration",
            routes: [
              { name: "Live Streams", path: "/streams", description: "Watch live Pump.fun trading streams", icon: SignalIcon, color: "text-green-400" },
              { name: "Debug API", path: "/debug-pump-fun", description: "Debug Pump.fun API with console logs", icon: SignalIcon, color: "text-yellow-400" },
              { name: "API Test", path: "/api/pump-fun/test", description: "Test Pump.fun API connection", icon: SignalIcon, color: "text-blue-400" },
              { name: "Generate Token", path: "/api/auth/pump-fun-token", description: "Generate JWT token for API access", icon: SignalIcon, color: "text-purple-400" },
            ]
          }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div 
            className="flex items-center justify-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity mb-6"
            onClick={() => router.push('/')}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FS</span>
            </div>
            <span className="text-white font-bold text-3xl">FlexIt</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Navigation Hub
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Quick access to all pages and features. Click any route to navigate instantly.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-8">
          {navigationRoutes.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></span>
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.routes.map((route, routeIndex) => (
                  <Card 
                    key={routeIndex} 
                    className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => router.push(route.path)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <route.icon className={`w-8 h-8 ${route.color}`} />
                          <div>
                            <CardTitle className="text-white text-lg">{route.name}</CardTitle>
                            <CardDescription className="text-gray-400 text-sm">
                              {route.path}
                            </CardDescription>
                          </div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm">{route.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Quick Creator Flow
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700 h-16"
              onClick={() => router.push('/')}
            >
              <div className="text-center">
                <div className="font-bold">1. Explore</div>
                <div className="text-sm opacity-90">Landing Page</div>
              </div>
            </Button>
            
            <Button 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-16"
              onClick={() => router.push('/demo')}
            >
              <div className="text-center">
                <div className="font-bold">2. Demo</div>
                <div className="text-sm opacity-90">See Features</div>
              </div>
            </Button>
            
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 h-16"
              onClick={() => router.push('/auth/signup')}
            >
              <div className="text-center">
                <div className="font-bold">3. Sign Up</div>
                <div className="text-sm opacity-90">Create Account</div>
              </div>
            </Button>
            
            <Button 
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 h-16"
              onClick={() => router.push('/create')}
            >
              <div className="text-center">
                <div className="font-bold">4. Create</div>
                <div className="text-sm opacity-90">First Post</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-12 text-center">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-2">
            ✅ All routes are working and ready to test!
          </Badge>
        </div>
      </div>
    </div>
  );
}
