'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, Image, DollarSign, Hash, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { POST_TYPES, CreatePostData } from '@/types';
import { supabase } from '@/lib/supabase';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePostData>({
    type: 'earnings_flex',
    content: '',
    earnings_amount: undefined,
    token_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;
    if (!connected || !publicKey) {
      alert('Connect your wallet to create a post.');
      return;
    }

    setLoading(true);
    try {
      // Resolve/create profile by wallet address
      const address = publicKey.toBase58();
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (profileError || !profile) {
        const defaultUsername = `user_${address.slice(0, 6)}`;
        const defaultDisplay = `User ${address.slice(0, 4)}...${address.slice(-4)}`;
        const createRes = await supabase
          .from('users')
          .insert({
            wallet_address: address,
            username: defaultUsername,
            display_name: defaultDisplay,
          })
          .select('*')
          .single();
        if (createRes.error) {
          console.error('Create profile failed:', createRes.error);
          alert('Could not create profile. Please try again.');
          return;
        }
        profile = createRes.data as any;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: (profile as any).id,
          type: formData.type,
          content: formData.content.trim(),
          earnings_amount: formData.earnings_amount || null,
          token_address: formData.token_address || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      // Reset form and close modal
      setFormData({
        type: 'earnings_flex',
        content: '',
        earnings_amount: undefined,
        token_address: '',
      });
      onOpenChange(false);
      
      // Refresh the page to show new post
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePostData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedPostType = POST_TYPES.find(type => type.value === formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Create New Post
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {POST_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange('type', type.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-white font-medium">{type.label}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {type.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What's on your mind?
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Share your trading success, stream highlight, or journey..."
              rows={4}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-400">
                {formData.content.length}/500 characters
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Hash className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Earnings Information (for earnings_flex type) */}
          {formData.type === 'earnings_flex' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Earnings Amount (USD)
                </label>
                <Input
                  type="number"
                  value={formData.earnings_amount || ''}
                  onChange={(e) => handleInputChange('earnings_amount', 
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )}
                  placeholder="Enter your earnings amount"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Address (Optional)
                </label>
                <Input
                  value={formData.token_address}
                  onChange={(e) => handleInputChange('token_address', e.target.value)}
                  placeholder="Enter the token contract address"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {formData.content && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-400">Preview:</span>
                <Badge variant="outline" className="text-xs">
                  {selectedPostType?.icon} {selectedPostType?.label}
                </Badge>
              </div>
              <p className="text-white text-sm">
                {formData.content}
              </p>
              {formData.earnings_amount && (
                <div className="mt-2 text-green-400 font-semibold">
                  💰 ${formData.earnings_amount.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.content.trim()}
              className="flexstream-gradient"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
