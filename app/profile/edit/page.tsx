'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWalletCompat';
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
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { SocialVerification } from '@/components/profile/SocialVerification';

interface UsernameCheckResult {
  available: boolean;
  reason?: string;
  message?: string;
  suggestions?: string[];
}

export default function EditProfilePage() {
  const router = useRouter();
  const { connected, publicKey, connecting, ready } = useWallet();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Social verification states
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [twitterFollowers, setTwitterFollowers] = useState(0);
  const [twitterVerifiedAt, setTwitterVerifiedAt] = useState<string | undefined>();
  const [youtubeVerified, setYoutubeVerified] = useState(false);
  const [youtubeSubscribers, setYoutubeSubscribers] = useState(0);
  const [youtubeChannelName, setYoutubeChannelName] = useState<string | undefined>();
  const [youtubeVerifiedAt, setYoutubeVerifiedAt] = useState<string | undefined>();
  const [tiktokVerified, setTiktokVerified] = useState(false);
  const [tiktokFollowers, setTiktokFollowers] = useState(0);
  const [tiktokVerifiedAt, setTiktokVerifiedAt] = useState<string | undefined>();
  const [tiktok, setTiktok] = useState('');

  // Local file previews
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  // Username availability check
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameCheckResult, setUsernameCheckResult] = useState<UsernameCheckResult | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load user data from Supabase
  useEffect(() => {
    // Wait for wallet SDK to be fully ready before making any decisions
    if (!ready) {
      console.log('[EditProfile] Waiting for wallet SDK to be ready...');
      return;
    }

    // Only redirect if wallet SDK is ready AND user is not connected
    if (!connected || !publicKey) {
      console.log('[EditProfile] User not connected, redirecting to home');
      router.push('/');
      return;
    }

    console.log('[EditProfile] User connected, loading profile...');
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, ready]);

  const loadUserProfile = async () => {
    if (!supabase || !publicKey) return;

    try {
      setLoading(true);
      const walletAddress = publicKey.toBase58();
      console.log('Loading profile for wallet:', walletAddress);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        console.error('Error loading profile:', error);

        if (error.code === 'PGRST116') {
          // User not found, wait for useEnsureUser to create them
          toast.error('Profile not found. Please wait a moment and refresh.', { duration: 5000 });
          setTimeout(() => loadUserProfile(), 2000);
        } else {
          toast.error('Failed to load profile');
        }
        return;
      }

      if (user) {
        console.log('Profile loaded:', user.username);

        // Check if this is setup mode (profile not completed or auto-generated username)
        const isAutoUsername = user.username?.match(/^user[a-z0-9]{10,}$/);
        const needsSetup = !user.profile_completed || isAutoUsername;
        setIsSetupMode(needsSetup);

        setOriginalUsername(user.username || '');
        setDisplayName(user.display_name || '');
        setUsername(needsSetup ? '' : (user.username || '')); // Clear username in setup mode
        setBio(user.bio || '');
        setWebsite(user.website || '');
        setTwitter(user.twitter || '');
        setInstagram(user.instagram || '');
        setAvatarUrl(user.avatar_url || '');
        setCoverUrl(user.cover_url || '');

        // Load social verification data
        setTwitterVerified(user.twitter_verified || false);
        setTwitterFollowers(user.twitter_followers || 0);
        setTwitterVerifiedAt(user.twitter_verified_at);
        setYoutubeVerified(user.youtube_verified || false);
        setYoutubeSubscribers(user.youtube_subscribers || 0);
        setYoutubeChannelName(user.youtube_channel_name);
        setYoutubeVerifiedAt(user.youtube_verified_at);
        setTiktokVerified(user.tiktok_verified || false);
        setTiktokFollowers(user.tiktok_followers || 0);
        setTiktok(user.tiktok || '');
        setTiktokVerifiedAt(user.tiktok_verified_at);

        if (needsSetup) {
          console.log('Setup mode activated - user needs to choose username');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameCheckResult(null);
      return;
    }

    // Don't check if it's the same as original username
    if (usernameToCheck === originalUsername && !isSetupMode) {
      setUsernameCheckResult({ available: true, message: 'Current username' });
      return;
    }

    setCheckingUsername(true);
    try {
      const walletAddress = publicKey?.toBase58() || '';
      const response = await fetch(
        `/api/users/check-username?username=${encodeURIComponent(usernameToCheck)}&wallet=${encodeURIComponent(walletAddress)}`
      );
      const result = await response.json();

      if (result.success) {
        setUsernameCheckResult({
          available: result.available,
          reason: result.reason,
          message: result.message,
          suggestions: result.suggestions
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  }, [originalUsername, isSetupMode, publicKey]);

  // Debounced username change handler
  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    setUsernameCheckResult(null);

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Set new timeout for debounced check
    if (sanitized.length >= 3) {
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

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
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validation
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      toast.error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    // Check if username is available (if changed)
    if (username !== originalUsername && usernameCheckResult && !usernameCheckResult.available) {
      toast.error('Please choose an available username');
      return;
    }

    try {
      setSaving(true);
      toast.loading('Saving your profile...', { id: 'save-profile' });

      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        toast.loading('Uploading avatar...', { id: 'save-profile' });
        const uploadedUrl = await uploadImage(avatarFile, 'avatar');
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload avatar', { id: 'save-profile' });
          setSaving(false);
          return;
        }
      }

      // Upload cover if changed
      let newCoverUrl = coverUrl;
      if (coverFile) {
        toast.loading('Uploading cover image...', { id: 'save-profile' });
        const uploadedUrl = await uploadImage(coverFile, 'cover');
        if (uploadedUrl) {
          newCoverUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload cover image', { id: 'save-profile' });
          setSaving(false);
          return;
        }
      }

      // Update profile via API
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

      toast.loading('Updating profile...', { id: 'save-profile' });

      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      console.log('Profile updated successfully!');
      toast.success(isSetupMode ? 'Profile created successfully!' : 'Profile updated successfully!', {
        id: 'save-profile',
        duration: 2000
      });

      // Clean up preview URLs
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);

      // Update session storage
      sessionStorage.setItem('current_username', result.data.username);
      sessionStorage.setItem('current_user', JSON.stringify(result.data));
      sessionStorage.removeItem('needs_profile_setup');

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });

      // Wait for DB to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to profile using wallet address as the source of truth
      window.location.href = `/profile/${result.data.wallet_address}`;
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(errorMessage, { id: 'save-profile' });
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return (
      <AppLayout showWallet={true} showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary">{!ready ? 'Initializing...' : 'Loading profile...'}</p>
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
              {isSetupMode ? (
                <>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent mb-1 sm:mb-2">
                    Welcome to FlexStream!
                  </h1>
                  <p className="text-sm sm:text-base text-white/70">
                    Let&apos;s set up your profile to get started
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-0.5 sm:mb-1">Edit Profile</h1>
                  <p className="text-xs sm:text-sm text-secondary">Update your profile information</p>
                </>
              )}
            </div>
            {!isSetupMode && (
              <Button
                variant="ghost"
                onClick={() => router.push('/profile')}
                className="text-secondary hover:text-primary absolute right-0 w-8 h-8 sm:w-9 sm:h-9"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Avatar & Cover */}
          <div className="mb-6 sm:mb-8">
            {/* Cover Image */}
            <div className="h-24 sm:h-32 bg-gradient-to-br from-accent-green/20 via-accent-cyan/20 to-accent-blue/20 rounded-xl sm:rounded-2xl relative mb-4 sm:mb-6 overflow-hidden">
              {(coverPreview || coverUrl) && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverPreview || coverUrl})` }}
                />
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
                  <AvatarFallback className="bg-gradient-to-br from-accent-green via-accent-cyan to-accent-blue text-black font-bold text-2xl sm:text-3xl">
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
                  className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-accent-green hover:bg-accent-green/90 rounded-full flex items-center justify-center transition-colors ring-4 ring-app-bg disabled:opacity-50"
                >
                  <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 sm:space-y-6">
            {/* Username - Prominent in setup mode */}
            <div className={isSetupMode ? 'p-4 bg-white/5 rounded-xl border border-accent-green/30' : ''}>
              <label className="block text-primary font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
                Username *
                {isSetupMode && <span className="text-accent-green ml-2">(Choose wisely!)</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary text-sm sm:text-base">@</span>
                <Input
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="yourname"
                  className={`bg-card-bg border-white/10 text-primary pl-7 sm:pl-8 pr-10 h-10 sm:h-11 text-sm sm:text-base ${
                    usernameCheckResult
                      ? usernameCheckResult.available
                        ? 'border-green-500/50 focus:border-green-500'
                        : 'border-red-500/50 focus:border-red-500'
                      : ''
                  }`}
                  disabled={saving}
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <ArrowPathIcon className="w-4 h-4 text-white/50 animate-spin" />
                  ) : usernameCheckResult ? (
                    usernameCheckResult.available ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )
                  ) : null}
                </div>
              </div>
              {/* Username feedback */}
              <div className="mt-1.5">
                {usernameCheckResult && !usernameCheckResult.available && (
                  <p className="text-xs text-red-400">{usernameCheckResult.message}</p>
                )}
                {usernameCheckResult?.suggestions && usernameCheckResult.suggestions.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-white/50">Try:</span>
                    {usernameCheckResult.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setUsername(suggestion);
                          checkUsernameAvailability(suggestion);
                        }}
                        className="text-xs px-2 py-0.5 bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/30 transition-colors"
                      >
                        @{suggestion}
                      </button>
                    ))}
                  </div>
                )}
                {usernameCheckResult?.available && (
                  <p className="text-xs text-green-400">{usernameCheckResult.message || 'Username is available!'}</p>
                )}
                {!usernameCheckResult && username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-white/50">Username must be at least 3 characters</p>
                )}
              </div>
              <p className="text-xs text-secondary mt-1">
                flexstream.com/@{username || 'username'}
              </p>
            </div>

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

            {/* Social Verification Section */}
            <div className="pt-4 border-t border-white/10">
              <SocialVerification
                walletAddress={publicKey?.toBase58() || ''}
                twitterVerified={twitterVerified}
                twitterUsername={twitter}
                twitterFollowers={twitterFollowers}
                twitterVerifiedAt={twitterVerifiedAt}
                youtubeVerified={youtubeVerified}
                youtubeChannelName={youtubeChannelName}
                youtubeSubscribers={youtubeSubscribers}
                youtubeVerifiedAt={youtubeVerifiedAt}
                tiktokVerified={tiktokVerified}
                tiktokUsername={tiktok}
                tiktokFollowers={tiktokFollowers}
                tiktokVerifiedAt={tiktokVerifiedAt}
                onVerificationChange={() => loadUserProfile()}
              />
            </div>

            {/* Manual Social Links (for unverified accounts) */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-primary font-medium text-sm sm:text-base">Manual Social Links</label>
                <span className="text-xs text-white/40">Optional - for unverified accounts</span>
              </div>
              <p className="text-xs text-white/50 mb-3">
                You can add social links manually, but verified accounts get a trust score boost and verified badge.
              </p>
              <div className="space-y-2 sm:space-y-3">
                {!twitterVerified && (
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary">𝕏</span>
                    <Input
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="Twitter username (unverified)"
                      className="bg-card-bg border-white/10 text-primary pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                      disabled={saving}
                    />
                  </div>
                )}
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
                {!tiktokVerified && (
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary">🎵</span>
                    <Input
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="TikTok username (unverified)"
                      className="bg-card-bg border-white/10 text-primary pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
            {!isSetupMode && (
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                className="flex-1 border-white/20 text-secondary hover:bg-card-bg/80 h-10 sm:h-11 text-sm sm:text-base"
                disabled={saving}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              className={`${isSetupMode ? 'w-full' : 'flex-1'} bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black h-12 sm:h-13 text-base sm:text-lg shadow-lg hover:shadow-accent-green/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              disabled={saving || (username !== originalUsername && usernameCheckResult !== null && !usernameCheckResult.available)}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : isSetupMode ? (
                <span>Complete Setup</span>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>

          {isSetupMode && (
            <p className="text-center text-xs text-white/50 mt-4">
              You can always update your profile later in settings
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
