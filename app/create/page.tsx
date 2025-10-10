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

  const handleUpload = (files: File[]) => {
    console.log('Uploading files:', files);
    // Handle file upload logic here
    router.push('/');
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
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3 text-center">
            Create Something Amazing
          </h1>
          <p className="text-secondary text-center max-w-2xl mx-auto">
            Transform your creativity into digital assets. Choose how you want to bring your vision to life.
          </p>
        </div>

        {/* Creation Options */}
        <div className="px-4 sm:px-0 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creationOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className="group bg-card-bg rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer hover:scale-105"
              >
                <div className={cn(
                  "w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg",
                  option.gradient
                )}>
                  <option.icon className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-primary font-bold text-xl text-center mb-3 group-hover:text-purple-400 transition-colors">
                  {option.title}
                </h3>
                
                <p className="text-secondary text-center text-sm leading-relaxed">
                  {option.description}
                </p>
                
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div className="px-4 sm:px-0 max-w-4xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-white/5">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">
                Ready to Launch Your Creative Journey?
              </h2>
              <p className="text-secondary mb-6 max-w-2xl mx-auto">
                Join thousands of creators who are already building their digital legacy on FlexStream. 
                From NFTs to tokens, bring your wildest ideas to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-xl"
                >
                  Start Creating
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/explore')}
                  className="border-white/20 text-secondary hover:bg-white/5 px-8 py-3 rounded-xl"
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
        onUpload={handleUpload}
      />
    </AppLayout>
  );
}
