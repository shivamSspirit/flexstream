'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShieldCheckIcon,
  DocumentArrowUpIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface VerificationRequest {
  id: string;
  type: 'pump_fun' | 'wallet' | 'earnings';
  status: 'pending' | 'approved' | 'rejected';
  amount?: number;
  token_address?: string;
  screenshot_url?: string;
  wallet_address?: string;
  created_at: string;
  reviewed_at?: string;
  notes?: string;
}

export default function VerificationPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'status'>('submit');
  
  // Form state
  const [verificationType, setVerificationType] = useState<'pump_fun' | 'wallet' | 'earnings'>('pump_fun');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
      return;
    }

    if (isSignedIn) {
      fetchVerificationRequests();
    }
  }, [userId, isLoaded, router]);

  const fetchVerificationRequests = async () => {
    if (!isSignedIn) return;

    try {
      setLoading(true);
      // Mock data - in real app, fetch from verification_requests table
      const mockRequests: VerificationRequest[] = [
        {
          id: '1',
          type: 'pump_fun',
          status: 'approved',
          amount: 2500,
          token_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          screenshot_url: '/api/placeholder/400/300',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          notes: 'Verified pump.fun trade'
        },
        {
          id: '2',
          type: 'earnings',
          status: 'pending',
          amount: 1200,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        }
      ];
      setRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;

    try {
      setSubmitting(true);
      
      // Upload screenshot if provided
      let screenshotUrl = '';
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        // In real app, upload to Supabase Storage
        screenshotUrl = '/api/placeholder/400/300';
      }

      // Create verification request
      const newRequest: VerificationRequest = {
        id: Date.now().toString(),
        type: verificationType,
        status: 'pending',
        amount: amount ? parseFloat(amount) : undefined,
        token_address: tokenAddress || undefined,
        wallet_address: walletAddress || undefined,
        screenshot_url: screenshotUrl || undefined,
        created_at: new Date().toISOString(),
        notes: notes || undefined,
      };

      setRequests(prev => [newRequest, ...prev]);
      
      // Reset form
      setAmount('');
      setTokenAddress('');
      setWalletAddress('');
      setNotes('');
      setScreenshot(null);
      setActiveTab('status');
      
    } catch (error) {
      console.error('Error submitting verification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Verification Portal</h1>
          <p className="text-gray-400">Verify your trades and earnings to build credibility</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          <Button
            variant={activeTab === 'submit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('submit')}
            className={`flex-1 ${
              activeTab === 'submit' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Submit Verification
          </Button>
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('status')}
            className={`flex-1 ${
              activeTab === 'status' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Verification Status
          </Button>
        </div>

        {/* Submit Verification */}
        {activeTab === 'submit' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <ShieldCheckIcon className="h-5 w-5" />
                <span>Submit Verification Request</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload proof of your trades to get verified and build trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Verification Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'pump_fun', label: 'Pump.fun Trade', icon: '🚀' },
                      { value: 'wallet', label: 'Wallet Verification', icon: '💼' },
                      { value: 'earnings', label: 'Earnings Proof', icon: '💰' },
                    ].map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={verificationType === type.value ? 'default' : 'outline'}
                        onClick={() => setVerificationType(type.value as any)}
                        className={`h-16 flex flex-col items-center space-y-2 ${
                          verificationType === type.value 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-sm">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                {verificationType !== 'wallet' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount Earned (USD)
                    </label>
                    <Input
                      type="number"
                      placeholder="2500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-gray-900/50 border-gray-700/50 text-white"
                    />
                  </div>
                )}

                {/* Token Address */}
                {verificationType === 'pump_fun' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Contract Address
                    </label>
                    <Input
                      placeholder="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      className="bg-gray-900/50 border-gray-700/50 text-white font-mono text-sm"
                    />
                  </div>
                )}

                {/* Wallet Address */}
                {verificationType === 'wallet' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Wallet Address
                    </label>
                    <Input
                      placeholder="Your Solana wallet address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="bg-gray-900/50 border-gray-700/50 text-white font-mono text-sm"
                    />
                  </div>
                )}

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Screenshot/Proof
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="cursor-pointer text-purple-400 hover:text-purple-300"
                    >
                      {screenshot ? screenshot.name : 'Click to upload screenshot'}
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, or GIF up to 10MB
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Any additional information about this trade..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-gray-900/50 border-gray-700/50 text-white"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'Submitting...' : 'Submit Verification Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Verification Status */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-8 text-center">
                  <ShieldCheckIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No verification requests</h3>
                  <p className="text-gray-400 mb-4">
                    Submit your first verification request to get started
                  </p>
                  <Button
                    onClick={() => setActiveTab('submit')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Submit Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="bg-gray-800/50 border-gray-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-full bg-gray-700/50">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-white">
                              {request.type.replace('_', ' ').toUpperCase()} Verification
                            </h3>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          
                          {request.amount && (
                            <div className="flex items-center space-x-1 mb-2">
                              <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                              <span className="text-green-400 font-semibold">
                                ${request.amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          {request.token_address && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-400">Token:</p>
                              <code className="text-xs text-gray-300 font-mono bg-gray-900/50 px-2 py-1 rounded">
                                {request.token_address.slice(0, 20)}...
                              </code>
                            </div>
                          )}
                          
                          {request.wallet_address && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-400">Wallet:</p>
                              <code className="text-xs text-gray-300 font-mono bg-gray-900/50 px-2 py-1 rounded">
                                {request.wallet_address.slice(0, 20)}...
                              </code>
                            </div>
                          )}
                          
                          {request.notes && (
                            <p className="text-sm text-gray-300 mb-2">{request.notes}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                            {request.reviewed_at && (
                              <span>Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {request.screenshot_url && (
                        <div className="ml-4">
                          <img
                            src={request.screenshot_url}
                            alt="Verification screenshot"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
