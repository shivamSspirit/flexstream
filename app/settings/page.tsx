'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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
  InformationCircleIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
// Wallet management is read-only here; wallet address is source of truth.

export default function SettingsPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');
  const [copied, setCopied] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      fetchProfile(publicKey.toBase58());
    } else if (!connected) {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchProfile = async (address: string) => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .single();

      let effective = profileData as any | null;
      if (profileError || !profileData) {
        // create default profile
        const defaultUsername = `user_${address.slice(0, 6)}`;
        const defaultDisplay = `User ${address.slice(0, 4)}...${address.slice(-4)}`;
        const { data: created } = await supabase
          .from('users')
          .insert({ wallet_address: address, username: defaultUsername, display_name: defaultDisplay })
          .select('*')
          .single();
        effective = created as any;
      }
      if (effective) {
        setProfile(effective);
        setDisplayName(effective.display_name || '');
        setAvatarUrl(effective.avatar_url || '');
      }
    } catch (e) {
      console.error('Settings profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!publicKey || !connected || !profile) return;
    try {
      // Update with cache-busting timestamp
      const updateData: any = { 
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', profile.id);
      
      if (error) {
        console.error('Failed to update profile:', error);
        return;
      }
      
      setProfile({ ...profile, ...updateData });
      
      // Navigate back to user profile with timestamp to force refresh
      router.push(`/profile?ts=${Date.now()}`);
    } catch (e) {
      console.error('Save profile error:', e);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!publicKey || !connected || !profile) {
      console.error('[Upload] Missing requirements:', { publicKey: !!publicKey, connected, profile: !!profile });
      return;
    }
    try {
      setUploading(true);
      console.log('[Upload] Starting upload for:', file.name);
      
      const ext = file.name.split('.').pop() || 'png';
      const timestamp = Date.now();
      const path = `avatars/${publicKey.toBase58()}/${timestamp}.${ext}`;
      
      console.log('[Upload] Path:', path);
      
      const { error: upErr } = await supabase.storage
        .from('flexstream')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      
      if (upErr) {
        console.error('[Upload] Upload failed:', upErr);
        return;
      }
      
      const { data } = supabase.storage.from('flexstream').getPublicUrl(path);
      console.log('[Upload] Got public URL:', data?.publicUrl);
      
      if (data?.publicUrl) {
        const newAvatarUrl = data.publicUrl;
        setAvatarUrl(newAvatarUrl);
        
        console.log('[Upload] Updating database with URL:', newAvatarUrl);
        
        // Immediately save the new avatar to database with updated_at
        const { error: updateErr } = await supabase
          .from('users')
          .update({ 
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        if (updateErr) {
          console.error('[Upload] DB update failed:', updateErr);
        } else {
          console.log('[Upload] ✅ Avatar saved to DB successfully');
          // Update local profile state
          setProfile({ ...profile, avatar_url: newAvatarUrl, updated_at: new Date().toISOString() });
        }
      }
    } catch (e) {
      console.error('[Upload] Exception:', e);
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      await uploadAvatar(file);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      await uploadAvatar(file);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Connect your wallet to edit profile</div>
          <Button onClick={() => router.push('/')} className="bg-green-600 hover:bg-green-700 text-white">
            Get Started
          </Button>
        </div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Profile not found</div>
        </div>
      </div>
    );
  }

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
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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

        {/* Settings Content */}
        <div className="flex-1 bg-black p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-3xl font-bold mb-8">Settings</h1>

            {/* Tabs */}
            <div className="flex space-x-8 border-b border-gray-800 mb-8">
              <button
                onClick={() => setActiveTab('account')}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'account'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Account
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-green-500 text-green-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Security
              </button>
            </div>

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                {/* Account Details */}
                <div>
                  <h2 className="text-white text-xl font-bold mb-6">Account Details</h2>
                  
                  <div className="space-y-6">
                    {/* Username */}
                  <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="text-white font-medium">Username</label>
                        <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                  </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value="@flexstream_user"
                          readOnly
                          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 flex-1"
                        />
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          Save username
                        </Button>
                      </div>
                </div>

                    {/* Email */}
                  <div>
                      <label className="text-white font-medium block mb-2">Email</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="email"
                          value="flexstream.user@example.com"
                          readOnly
                          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 flex-1"
                        />
                        <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                          Update email
                        </Button>
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        This is the email address linked to your account.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet (read-only) */}
                <div>
                  <h2 className="text-white text-xl font-bold mb-6">Wallet</h2>
                  <div className="space-y-3">
                    <label className="text-white font-medium block">Wallet Address</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={publicKey.toBase58()}
                        readOnly
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 flex-1"
                      />
                      <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800" onClick={() => navigator.clipboard.writeText(publicKey.toBase58())}>
                        Copy
                      </Button>
                    </div>
                    <p className="text-gray-400 text-sm">Wallet is your proof of ownership and cannot be changed.</p>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h2 className="text-white text-xl font-bold mb-6">Notifications</h2>
                  
                  <div className="space-y-6">
                    {/* Marketing Email */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mt-1 w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                      />
                  <div>
                        <label className="text-white font-medium">Marketing email notifications</label>
                        <p className="text-gray-400 text-sm mt-1">
                          You will receive updates on new features and promotions from FlexStream to your email address.
                        </p>
                  </div>
                </div>

                    {/* In-app Notifications */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mt-1 w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                      />
                  <div>
                        <label className="text-white font-medium">In-app notifications</label>
                        <p className="text-gray-400 text-sm mt-1">
                          Get notified about activity related to your posts, holdings and rewards.
                        </p>
                </div>
              </div>

                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Save settings
                    </Button>
                  </div>
                </div>

                {/* Backup Account */}
                  <div>
                  <h2 className="text-white text-xl font-bold mb-6">Backup Account</h2>
                  <p className="text-gray-400 mb-4">
                    Ensure access to your account, secure your assets, and log in seamlessly onto the FlexStream app without using a password. 
                    <a href="#" className="text-green-400 hover:underline ml-1">Learn more</a>
                  </p>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                    Get started
                  </Button>
                </div>

                {/* Delete Account */}
                  <div>
                  <h2 className="text-white text-xl font-bold mb-6">Delete Account</h2>
                  <p className="text-gray-400 mb-4">
                    Deleting your account will permanently remove your offchain data from FlexStream. This action cannot be undone.
                  </p>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Delete Account
                  </Button>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <h2 className="text-white text-xl font-bold">Edit Profile</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-white font-medium block mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-white font-medium block mb-2">Avatar Image</label>
                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      className={`rounded-lg border-2 ${isDragging ? 'border-green-500' : 'border-gray-700'} border-dashed p-4 flex items-center space-x-4 bg-gray-900`}
                    >
                      <img
                        src={previewUrl || avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'}
                        alt="Avatar Preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm mb-1">Drag & drop an image here, or click to choose</p>
                        <p className="text-gray-500 text-xs">PNG, JPG, WEBP up to ~5MB</p>
                        {selectedFileName && (
                          <p className="text-gray-400 text-xs mt-1">Selected: {selectedFileName}{selectedFileSize ? ` (${Math.round(selectedFileSize / 1024)} KB)` : ''}</p>
                        )}
                      </div>
                      <label className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 cursor-pointer">
                        {uploading ? 'Uploading...' : 'Choose File'}
                        <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                      </label>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">A public URL will be saved to your profile.</p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={saveProfile} disabled={uploading}>
                    {uploading ? 'Saving…' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="text-center py-12">
                <p className="text-gray-400">Security settings coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}