'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/hooks/useWalletCompat';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeftIcon, CameraIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { publicKey } = useWallet();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    twitter: '',
    instagram: '',
    website: '',
    tiktok: '',
  });

  // Load current profile
  useEffect(() => {
    async function loadProfile() {
      if (!publicKey) return;

      try {
        const response = await fetch(`/api/users/by-wallet?wallet=${publicKey.toBase58()}`);
        const data = await response.json();

        if (data.success && data.user) {
          setProfile({
            displayName: data.user.display_name || '',
            username: data.user.username || '',
            bio: data.user.bio || '',
            avatarUrl: data.user.avatar_url || '',
            twitter: data.user.twitter || '',
            instagram: data.user.instagram || '',
            website: data.user.website || '',
            tiktok: data.user.tiktok || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [publicKey]);

  const handleSave = async () => {
    if (!publicKey) return;

    setSaving(true);
    try {
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          ...profile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated!');
        router.back();
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showWallet={true} showSearch={false}>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="heading-3">Edit Profile</h1>
            <p className="body-sm">Update your public information</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent-green text-black hover:bg-accent-green/90"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Avatar */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-4 border-white/10">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white text-2xl font-bold">
                {profile.displayName?.[0] || profile.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-accent-purple hover:bg-accent-purple/90 rounded-full flex items-center justify-center transition-colors">
              <CameraIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-sm text-text-muted mt-2">Click to change avatar</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Display Name</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
              placeholder="Your display name"
              maxLength={50}
              className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">@</span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="username"
                maxLength={30}
                className="w-full pl-8 pr-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              maxLength={160}
              rows={3}
              className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50 resize-none"
            />
            <p className="text-xs text-text-muted mt-1">{profile.bio.length}/160</p>
          </div>

          {/* Social Links */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="font-semibold text-white mb-4">Social Links</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Twitter</label>
                <input
                  type="text"
                  value={profile.twitter}
                  onChange={(e) => setProfile(p => ({ ...p, twitter: e.target.value }))}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Instagram</label>
                <input
                  type="text"
                  value={profile.instagram}
                  onChange={(e) => setProfile(p => ({ ...p, instagram: e.target.value }))}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">TikTok</label>
                <input
                  type="text"
                  value={profile.tiktok}
                  onChange={(e) => setProfile(p => ({ ...p, tiktok: e.target.value }))}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Website</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
