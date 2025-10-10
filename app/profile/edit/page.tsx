'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('Digital Artist & NFT Creator exploring Web3');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');

  const handleSave = () => {
    // Save logic here
    console.log({ displayName, username, bio, website, twitter, instagram });
    router.push('/profile');
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">Edit Profile</h1>
              <p className="text-sm text-secondary">Update your profile information</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/profile')}
              className="text-secondary hover:text-primary"
            >
              <XMarkIcon className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="px-4 sm:px-0 max-w-2xl mx-auto">
          {/* Avatar & Cover */}
          <div className="mb-8">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl relative mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=200&fit=crop')] bg-cover bg-center opacity-20" />
              <button className="absolute bottom-4 right-4 px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2">
                <CameraIcon className="w-4 h-4" />
                Change Cover
              </button>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center -mt-16 relative z-10">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-app-bg">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-3xl">
                    {user?.firstName?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors ring-4 ring-app-bg">
                  <CameraIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-primary font-medium mb-2">Display Name *</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-card-bg border-white/10 text-primary"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-primary font-medium mb-2">Username *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">@</span>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="bg-card-bg border-white/10 text-primary pl-8"
                />
              </div>
              <p className="text-xs text-secondary mt-1">
                flexstream.com/@{username || 'username'}
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-primary font-medium mb-2">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={4}
                className="bg-card-bg border-white/10 text-primary resize-none"
              />
              <p className="text-xs text-secondary mt-1">
                {bio.length}/160 characters
              </p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-primary font-medium mb-2">Website</label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="bg-card-bg border-white/10 text-primary"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-primary font-medium mb-2">Social Links</label>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">𝕏</span>
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="Twitter username"
                    className="bg-card-bg border-white/10 text-primary pl-10"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">📷</span>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Instagram username"
                    className="bg-card-bg border-white/10 text-primary pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
              className="flex-1 border-white/20 text-secondary hover:bg-card-bg/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 flexstream-gradient text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
