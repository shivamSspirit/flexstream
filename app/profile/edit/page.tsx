'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function EditProfilePage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Local file previews
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  // Load user data from Supabase
  useEffect(() => {
    if (!connected || !publicKey) {
      router.push('/');
      return;
    }

    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  const loadUserProfile = async () => {
    if (!supabase || !publicKey) return;

    try {
      setLoading(true);
      const walletAddress = publicKey.toBase58();
      console.log('🔍 Loading profile for wallet:', walletAddress);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);

        // If user not found (PGRST116), they might be a new user
        if (error.code === 'PGRST116') {
          console.log('⚠️ User not found in database - might be new user');
          toast.error('Profile not found. Please wait a moment and refresh.', { duration: 5000 });

          // Give them a moment to be created by useEnsureUser
          setTimeout(() => {
            loadUserProfile();
          }, 2000);
        } else {
          toast.error('Failed to load profile');
        }
        return;
      }

      if (user) {
        console.log('✅ Profile loaded:', user.username);
        setDisplayName(user.display_name || '');
        setUsername(user.username || '');
        setBio(user.bio || '');
        setWebsite(user.website || '');
        setTwitter(user.twitter || '');
        setInstagram(user.instagram || '');
        setAvatarUrl(user.avatar_url || '');
        setCoverUrl(user.cover_url || '');
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const uploadImage = async (file: File, type: 'avatar' | 'cover'): Promise<string | null> => {
    if (!supabase || !publicKey) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${publicKey.toBase58()}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('flexstream')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('flexstream')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    console.log('💾 =========================');
    console.log('💾 STARTING SAVE PROCESS');
    console.log('💾 =========================');
    console.log('💾 Button clicked! Function is running.');

    if (!connected || !publicKey) {
      console.error('❌ Wallet not connected', { connected, publicKey: publicKey?.toBase58() });
      toast.error('Please connect your wallet');
      return;
    }

    const walletAddr = publicKey.toBase58();
    console.log('✅ Wallet connected:', walletAddr);
    console.log('📝 Current values:', {
      displayName,
      username,
      bio: bio?.substring(0, 20) + '...',
      website,
      twitter,
      instagram
    });

    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      toast.error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    console.log('✅ Validation passed');

    try {
      setSaving(true);
      toast.loading('Saving your profile...', { id: 'save-profile' });

      console.log('💾 Starting profile save process...');

      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        if (!supabase) {
          console.error('❌ Supabase not configured for file upload');
          toast.error('File upload not available', { id: 'save-profile' });
          setSaving(false);
          return;
        }

        console.log('📤 Uploading avatar...');
        console.log('   File name:', avatarFile.name);
        console.log('   File size:', (avatarFile.size / 1024).toFixed(2), 'KB');
        console.log('   File type:', avatarFile.type);
        toast.loading('Uploading avatar...', { id: 'save-profile' });
        const uploadedUrl = await uploadImage(avatarFile, 'avatar');
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
          console.log('✅ Avatar uploaded successfully!');
          console.log('   NEW AVATAR URL:', uploadedUrl);
          console.log('   This URL will be saved to database');
        } else {
          console.error('❌ Failed to upload avatar');
          toast.error('Failed to upload avatar', { id: 'save-profile' });
          setSaving(false);
          return;
        }
      } else {
        console.log('ℹ️  No new avatar selected, keeping existing:', newAvatarUrl);
      }

      // Upload cover if changed
      let newCoverUrl = coverUrl;
      if (coverFile) {
        if (!supabase) {
          console.error('❌ Supabase not configured for file upload');
          toast.error('File upload not available', { id: 'save-profile' });
          setSaving(false);
          return;
        }

        console.log('📤 Uploading cover...');
        toast.loading('Uploading cover image...', { id: 'save-profile' });
        const uploadedUrl = await uploadImage(coverFile, 'cover');
        if (uploadedUrl) {
          newCoverUrl = uploadedUrl;
          console.log('✅ Cover uploaded:', uploadedUrl);
        } else {
          console.error('❌ Failed to upload cover');
          toast.error('Failed to upload cover image', { id: 'save-profile' });
          setSaving(false);
          return;
        }
      }

      // Update user profile via API
      const updatePayload = {
        walletAddress: publicKey.toBase58(),
        displayName,
        username,
        bio,
        website,
        twitter,
        instagram,
        avatarUrl: newAvatarUrl,
        coverUrl: newCoverUrl
      };

      console.log('💾 Updating profile via API...', {
        ...updatePayload,
        walletAddress: updatePayload.walletAddress.substring(0, 8) + '...'
      });

      toast.loading('Updating profile...', { id: 'save-profile' });

      console.log('📡 Making API request to /api/users/update-profile');
      console.log('📡 Request payload:', JSON.stringify(updatePayload, null, 2));

      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('📡 API Response status:', response.status, response.statusText);

      // Show response status in toast for debugging
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
      }

      const result = await response.json();
      console.log('📡 API Response data:', result);

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Failed to update profile';
        console.error('❌ Error updating profile:', errorMsg);
        console.error('❌ Full error response:', result);
        throw new Error(errorMsg);
      }

      console.log('✅ Profile updated successfully!');
      console.log('   User ID:', result.data.id);
      console.log('   Username:', result.data.username);
      console.log('   Display Name:', result.data.display_name);
      console.log('   Avatar URL in DB:', result.data.avatar_url);

      if (newAvatarUrl && result.data.avatar_url === newAvatarUrl) {
        console.log('   ✅ AVATAR SAVED SUCCESSFULLY TO DATABASE!');
      } else if (newAvatarUrl && result.data.avatar_url !== newAvatarUrl) {
        console.error('   ❌ WARNING: Avatar URL mismatch!');
        console.error('      Expected:', newAvatarUrl);
        console.error('      Got:', result.data.avatar_url);
      }

      toast.success('Profile updated successfully!', { id: 'save-profile', duration: 2000 });

      // Clean up preview URLs
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);

      // Invalidate all user-related caches to show fresh data everywhere
      console.log('🔄 Invalidating all user caches...');
      await queryClient.invalidateQueries({ queryKey: ['currentUser', publicKey.toBase58()] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] }); // Invalidate feed posts to update avatar in posts
      await queryClient.invalidateQueries({ queryKey: ['userPosts'] }); // Invalidate user's own posts

      // Force refetch all queries to ensure avatar updates everywhere
      await queryClient.refetchQueries({ queryKey: ['currentUser', publicKey.toBase58()] });

      // Wait a moment for database to propagate changes
      console.log('⏳ Waiting for database to update...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to profile page with username - using window.location for hard refresh to show updated data
      console.log('🔄 Redirecting to profile page:', username);
      window.location.href = `/profile/${result.data.username}`; // Use the username from API response to be sure
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(errorMessage, { id: 'save-profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showWallet={true} showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="pb-20 md:pb-6 -mx-3 sm:-mx-4 md:mx-0">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-0 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 relative">
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-0.5 sm:mb-1">Edit Profile</h1>
              <p className="text-xs sm:text-sm text-secondary">Update your profile information</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/profile')}
              className="text-secondary hover:text-primary absolute right-0 w-8 h-8 sm:w-9 sm:h-9"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Avatar & Cover */}
          <div className="mb-6 sm:mb-8">
            {/* Cover Image */}
            <div className="h-24 sm:h-32 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl sm:rounded-2xl relative mb-4 sm:mb-6 overflow-hidden">
              {(coverPreview || coverUrl) && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverPreview || coverUrl})` }}
                />
              )}
              {!coverPreview && !coverUrl && (
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=200&fit=crop')] bg-cover bg-center opacity-20" />
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={saving}
                className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 disabled:opacity-50"
              >
                <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Change Cover</span>
                <span className="xs:hidden">Cover</span>
              </button>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center -mt-12 sm:-mt-16 relative z-10">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-app-bg">
                  <AvatarImage src={avatarPreview || avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-2xl sm:text-3xl">
                    {displayName?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors ring-4 ring-app-bg disabled:opacity-50"
                >
                  <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 sm:space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-primary font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">Display Name *</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-card-bg border-white/10 text-primary h-10 sm:h-11 text-sm sm:text-base"
                disabled={saving}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-primary font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">Username *</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary text-sm sm:text-base">@</span>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="bg-card-bg border-white/10 text-primary pl-7 sm:pl-8 h-10 sm:h-11 text-sm sm:text-base"
                  disabled={saving}
                />
              </div>
              <p className="text-xs text-secondary mt-1">
                flexstream.com/@{username || 'username'}
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-primary font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={4}
                maxLength={160}
                className="bg-card-bg border-white/10 text-primary resize-none text-sm sm:text-base"
                disabled={saving}
              />
              <p className="text-xs text-secondary mt-1">
                {bio.length}/160 characters
              </p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-primary font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">Website</label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="bg-card-bg border-white/10 text-primary h-10 sm:h-11 text-sm sm:text-base"
                disabled={saving}
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-primary font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">Social Links</label>
              <div className="space-y-2 sm:space-y-3">
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary">𝕏</span>
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="Twitter username"
                    className="bg-card-bg border-white/10 text-primary pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                    disabled={saving}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary">📷</span>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Instagram username"
                    className="bg-card-bg border-white/10 text-primary pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
              className="flex-1 border-white/20 text-secondary hover:bg-card-bg/80 h-10 sm:h-11 text-sm sm:text-base"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('🔥 BUTTON CLICKED!');
                handleSave();
              }}
              className="flex-1 bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black h-12 sm:h-13 text-base sm:text-lg shadow-lg hover:shadow-accent-green/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <span>💾 Save Changes</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
