'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { 
  PlusIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function CreatePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    console.log('✅ Post created successfully!');
    setIsModalOpen(false);
    // Optionally show a success toast/notification here
  };

  const creationOptions = [
    {
      id: 'upload',
      title: 'Upload Imagination',
      description: 'Create a coin from your photos, videos, or audio',
      icon: PlusIcon,
      gradient: 'from-purple-500 to-pink-500',
      action: () => setIsModalOpen(true)
    },
    {
      id: 'generate',
      title: 'AI Generate',
      description: 'Use AI to create unique digital art and tokens',
      icon: SparklesIcon,
      gradient: 'from-blue-500 to-cyan-500',
      action: () => router.push('/create/generate')
    },
    {
      id: 'launch',
      title: 'Launch Campaign',
      description: 'Start a crowdfunding campaign for your project',
      icon: RocketLaunchIcon,
      gradient: 'from-orange-500 to-red-500',
      action: () => router.push('/create/campaign')
    }
  ];

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="min-h-screen pb-20 md:pb-10">
        {/* Hero Section with Gradient Background */}
        <div className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-blue-600/10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full mb-4">
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-medium">Create & Earn</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
                Create Something
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Amazing
                </span>
              </h1>

              <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Transform your creativity into digital assets. Launch tokens, create NFTs, and build your digital legacy.
              </p>
            </div>

            {/* Creation Options - Large Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {creationOptions.map((option, index) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer hover:scale-[1.02] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center text-center"
                >
                  {/* Gradient Glow Effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
                    `bg-gradient-to-br ${option.gradient}`
                  )} />

                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-2xl",
                    option.gradient
                  )}>
                    <option.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-300 transition-colors">
                    {option.title}
                  </h3>

                  <p className="text-white/50 text-xs leading-relaxed mb-4">
                    {option.description}
                  </p>

                  {/* Animated Arrow */}
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-medium">
                    <span>Get Started</span>
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 mt-8 sm:mt-10">
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl -z-10" />

            <div className="relative text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to Launch Your Creative Journey?
              </h2>
              <p className="text-white/60 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                Join thousands of creators building their digital legacy. From NFTs to tokens, bring your wildest ideas to life.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-5 h-auto rounded-xl text-sm shadow-2xl shadow-purple-600/25 hover:shadow-purple-600/40 transition-all hover:scale-105"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Start Creating Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/explore')}
                  className="border-white/20 hover:border-white/40 text-white hover:bg-white/10 px-6 py-5 h-auto rounded-xl text-sm backdrop-blur-sm"
                >
                  Explore Examples
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </AppLayout>
  );
}
