'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export default function EditProfilePage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    wallet_address: '',
  });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProfile();
    } else if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
    }
  }, [isLoaded, userId, router]);

  const fetchProfile = async () => {
    if (!isSignedIn) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('privy_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        router.push('/auth/onboarding');
        return;
      }

      setFormData({
        display_name: data.display_name || '',
        username: data.username || '',
        bio: data.bio || '',
        wallet_address: data.wallet_address || '',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: formData.display_name,
          username: formData.username,
          bio: formData.bio || null,
          wallet_address: formData.wallet_address || null,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
        return;
      }

      router.push('/profile');
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Profile Information</CardTitle>
              <CardDescription className="text-gray-300">
                Update your profile details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name *
                    </label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Enter your display name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username *
                    </label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a unique username"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This will be your unique identifier on FlexStream
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about your trading journey..."
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Solana Wallet Address
                    </label>
                    <Input
                      value={formData.wallet_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                      placeholder="Enter your Solana wallet address"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Connect your wallet to verify earnings and unlock premium features
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flexstream-gradient text-white px-8 py-2"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
