'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
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
  }, [connected, publicKey]);

  const loadUserProfile = async () => {
    if (!supabase || !publicKey) return;

    try {
      setLoading(true);
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      if (user) {
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
      console.error('Error loading profile:', error);
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
    console.log('💾 Starting save process...');

    if (!connected || !publicKey) {
      console.error('❌ Wallet not connected');
      toast.error('Please connect your wallet');
      return;
    }

    console.log('✅ Wallet connected:', publicKey.toBase58());

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

      if (!supabase) {
        console.error('❌ Supabase not configured');
        throw new Error('Supabase not configured');
      }

      console.log('✅ Supabase configured');

      // Check if username is taken by another user
      console.log('🔍 Checking if username is available:', username);
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('username', username)
        .neq('wallet_address', publicKey.toBase58())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('❌ Error checking username:', checkError);
      }

      if (existingUser) {
        console.log('❌ Username taken by:', existingUser.wallet_address);
        toast.error('Username is already taken');
        setSaving(false);
        return;
      }

      console.log('✅ Username available');

      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        console.log('📤 Uploading avatar...');
        toast.info('Uploading avatar...');
        const uploadedUrl = await uploadImage(avatarFile, 'avatar');
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
          console.log('✅ Avatar uploaded:', uploadedUrl);
        } else {
          console.error('❌ Failed to upload avatar');
          toast.error('Failed to upload avatar');
          setSaving(false);
          return;
        }
      }

      // Upload cover if changed
      let newCoverUrl = coverUrl;
      if (coverFile) {
        console.log('📤 Uploading cover...');
        toast.info('Uploading cover image...');
        const uploadedUrl = await uploadImage(coverFile, 'cover');
        if (uploadedUrl) {
          newCoverUrl = uploadedUrl;
          console.log('✅ Cover uploaded:', uploadedUrl);
        } else {
          console.error('❌ Failed to upload cover');
          toast.error('Failed to upload cover image');
          setSaving(false);
          return;
        }
      }

      // Update user profile
      console.log('💾 Updating profile in database...', {
        displayName,
        username,
        bio,
        website,
        twitter,
        instagram,
        hasAvatar: !!newAvatarUrl,
        hasCover: !!newCoverUrl
      });

      // Build update object
      const updateData: Record<string, any> = {
        display_name: displayName,
        username: username,
        bio: bio,
        website: website,
        twitter: twitter,
        instagram: instagram,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      // Only add cover_url if we have one (in case column doesn't exist yet)
      if (newCoverUrl) {
        updateData.cover_url = newCoverUrl;
      }

      const { data: updateResult, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('wallet_address', publicKey.toBase58())
        .select();

      if (error) {
        console.error('❌ Error updating profile:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Profile updated in database:', updateResult);

      console.log('✅ Profile updated successfully!');
      toast.success('Profile updated successfully!');

      // Clean up preview URLs
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);

      // Redirect to profile page
      setTimeout(() => {
        console.log('🔄 Redirecting to profile...');
        router.push('/profile');
        // Force a hard refresh to reload the page with new data
        window.location.href = '/profile';
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
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
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-10 sm:h-11 text-sm sm:text-base"
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
