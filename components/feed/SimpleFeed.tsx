'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ChatBubbleLeftIcon,
  ArrowUpIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

export function SimpleFeed() {
  const router = useRouter();

  // Mock feed data - Zora style posts
  const posts = [
    {
      id: '1',
      user: {
        name: 'lemongab',
        username: 'lemongab',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
      },
      media: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=800&fit=crop',
      title: 'Padel Tournament Flyer',
      description: 'Illustration I made for the Padel Professor Club',
      price: '$113',
      holders: 'zero_siren and 2 others',
      time: '5m'
    },
    {
      id: '2',
      user: {
        name: 'cryptogrannyno5',
        username: 'cryptogrannyno5',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop'
      },
      media: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
      title: 'Digital Sunset Series',
      description: 'Part of my new collection exploring color and light',
      price: '$0.89',
      buyers: 'jaykimvalentine',
      time: '5m'
    },
    {
      id: '3',
      user: {
        name: 'marcusj',
        username: 'marcusj',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
      },
      media: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=800&fit=crop',
      title: 'Motion Study 003',
      description: 'Experimental 3D animation exploring movement',
      price: 'Free Mint',
      holders: '847 collectors',
      time: '12m'
    }
  ];

  return (
    <div className="space-y-12">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-transparent border-none"
        >
          {/* User Header - Zora Style (user info + time + menu) */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/profile/${post.user.username}`)}
              >
                <AvatarImage src={post.user.avatar} alt={post.user.name} />
                <AvatarFallback className="bg-gray-600 text-white">
                  {post.user.name[0]}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => router.push(`/profile/${post.user.username}`)}
                className="text-white text-base font-normal hover:opacity-70 transition-opacity"
              >
                {post.user.name}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-sm">{post.time}</span>
              <button className="text-white/40 hover:text-white/60 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Media - Full Width, Rounded Corners - Zora Style */}
          <div
            className="relative rounded-2xl overflow-hidden mb-4 cursor-pointer group bg-black"
            onClick={() => router.push(`/post/${post.id}`)}
          >
            <img
              src={post.media}
              alt={post.title}
              className="w-full aspect-square object-cover group-hover:opacity-95 transition-opacity"
            />
          </div>

          {/* Content - Zora Style */}
          <div className="space-y-4">
            {/* Price Badge + Buy Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-green-400">
                  <ArrowUpIcon className="w-4 h-4" />
                  <span className="text-base font-medium">{post.price}</span>
                </div>
                <button className="hover:opacity-60 transition-opacity">
                  <ChatBubbleLeftIcon className="w-5 h-5 text-white/50" />
                </button>
                <button className="hover:opacity-60 transition-opacity">
                  <ShareIcon className="w-5 h-5 text-white/50" />
                </button>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/post/${post.id}`);
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-10 py-2.5 h-auto rounded-full transition-all text-base"
              >
                Buy
              </Button>
            </div>

            {/* Holders Info - Zora Style */}
            {post.holders && (
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span>Held by {post.holders}</span>
              </div>
            )}

            {post.buyers && (
              <div className="text-sm text-white/60">
                <span className="text-white font-medium">{post.user.name}</span> bought{' '}
                <span className="text-green-400">{post.price}</span> of this post by{' '}
                <span className="text-white font-medium">{post.buyers}</span>
              </div>
            )}

            {/* Title & Description */}
            <div>
              <h2
                className="text-white text-lg font-semibold mb-1 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                {post.title}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                {post.description}
              </p>
            </div>

            {/* Comment Input - Zora Style */}
            <div>
              <input
                type="text"
                placeholder="Add a comment..."
                className="w-full bg-transparent border-none text-white/60 text-sm placeholder:text-white/40 focus:outline-none focus:text-white transition-colors py-2"
                onClick={() => router.push(`/post/${post.id}`)}
                readOnly
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
