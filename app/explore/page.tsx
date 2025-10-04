'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  HomeIcon,
  MapIcon,
  PlusIcon,
  BellIcon,
  CogIcon,
  BookmarkIcon,
  StarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ChartBarIcon,
  VideoCameraIcon,
  ArrowUpIcon,
  FireIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

export default function ExplorePage() {
  const router = useRouter();

  const filterCategories = [
    { name: 'Featured', icon: StarIcon, active: true },
    { name: 'Zora Stars', icon: StarIcon, active: false },
    { name: 'Friends Bought', icon: ShoppingCartIcon, active: false },
    { name: 'Top Creators', icon: UserGroupIcon, active: false },
    { name: 'Weekly Top Traders', icon: ChartBarIcon, active: false },
    { name: 'Videos', icon: VideoCameraIcon, active: false },
    { name: 'Top Posts', icon: ArrowUpIcon, active: false },
  ];

  const secondaryFilters = [
    { name: 'Trending Posts', icon: FireIcon },
    { name: 'New', icon: SparklesIcon },
  ];

  const explorePosts = [
    {
      id: 1,
      title: 'Empress Garbage',
      username: 'empiresstrash',
      time: '15m',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
      earnings: '$263.80',
      views: '$1.38',
      comments: 4,
      isNew: false
    },
    {
      id: 2,
      title: 'NES',
      username: 'roccanoo',
      time: '29m',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      earnings: '$156.20',
      views: '$0.89',
      comments: 12,
      isNew: false
    },
    {
      id: 3,
      title: '650s',
      username: 'walkingmehome',
      time: '1h',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      earnings: '$89.45',
      views: '$2.15',
      comments: 7,
      isNew: false
    },
    {
      id: 4,
      title: 'On Some Girl Shit',
      username: 'anyagta4ever',
      time: '2h',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
      earnings: '$312.67',
      views: '$1.92',
      comments: 23,
      isNew: true
    },
    {
      id: 5,
      title: 'Fotograma 48 | Lote',
      username: 'surmedia',
      time: '3h',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      earnings: '$178.33',
      views: '$0.67',
      comments: 9,
      isNew: false
    },
    {
      id: 6,
      title: 'Manson Family',
      username: 'walkingmehome',
      time: '4h',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      earnings: '$245.12',
      views: '$1.45',
      comments: 15,
      isNew: false
    },
    {
      id: 7,
      title: 'Something Intriguing',
      username: 'ranggapuraji',
      time: '5h',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      earnings: '$198.76',
      views: '$1.23',
      comments: 6,
      isNew: true
    },
    {
      id: 8,
      title: 'Green Shorts',
      username: 'ismo',
      time: '6h',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      earnings: '$134.89',
      views: '$0.78',
      comments: 11,
      isNew: false
    },
    {
      id: 9,
      title: 'Tea',
      username: 'janicemascarenhas',
      time: '7h',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
      earnings: '$67.45',
      views: '$0.34',
      comments: 3,
      isNew: false
    }
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">★</span>
            </div>
            <span className="text-white font-bold text-xl">FlexStream</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Landing Page</span>
          </button>
          
          <button 
            onClick={() => router.push('/explore')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <MapIcon className="w-5 h-5" />
            <span>Newsfeed</span>
          </button>
          
          <button 
            onClick={() => router.push('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
          
          <button 
            onClick={() => router.push('/settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <CogIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold">Settings</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for posts, creators, or to"
                className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 pl-10 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            <Button className="bg-gray-800 text-white hover:bg-gray-700">
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
            
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="bg-black border-b border-gray-800 px-6 py-4">
          <div className="flex items-center space-x-6 mb-4">
            {filterCategories.map((filter) => (
              <button
                key={filter.name}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  filter.active 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <filter.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{filter.name}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {secondaryFilters.map((filter) => (
                <button
                  key={filter.name}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <filter.icon className="w-4 h-4" />
                  <span className="text-sm">{filter.name}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-white">
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 bg-black p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {explorePosts.map((post) => (
              <div key={post.id} className="bg-gray-900 rounded-lg overflow-hidden relative">
                {post.isNew && (
                  <Badge className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 z-10">
                    NEW
                  </Badge>
                )}
                
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                    <span className="text-white text-sm font-medium">{post.username}</span>
                    <span className="text-gray-400 text-xs">{post.time}</span>
                  </div>
                  
                  <h3 className="text-white font-bold text-sm mb-3">{post.title}</h3>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-green-400 text-xs">
                      <ArrowUpIcon className="w-3 h-3" />
                      <span>{post.earnings}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 text-xs">
                      <span>©</span>
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 text-xs">
                      <span>💬</span>
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
