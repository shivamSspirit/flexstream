'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeftIcon, 
  PhotoIcon, 
  CurrencyDollarIcon, 
  FireIcon, 
  PlayIcon, 
  UserIcon,
  XMarkIcon,
  LinkIcon,
  DocumentIcon,
  VideoCameraIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import StorageDiagnostic from '@/components/StorageDiagnostic';
import SupabaseTest from '@/components/SupabaseTest';
import LinkPreviewTest from '@/components/LinkPreviewTest';
import { CreatePostData, LinkPreview as LinkPreviewType } from '@/types';

const POST_TYPES = [
  { id: 'earnings_flex', label: 'Earnings Flex', icon: CurrencyDollarIcon, color: 'text-green-400' },
  { id: 'stream_highlight', label: 'Stream Highlight', icon: PlayIcon, color: 'text-blue-400' },
  { id: 'lifestyle', label: 'Lifestyle', icon: UserIcon, color: 'text-purple-400' },
  { id: 'trading_journey', label: 'Trading Journey', icon: FireIcon, color: 'text-orange-400' },
];

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES];

// File size limits (in bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface LinkPreview {
  title: string;
  description: string;
  image: string;
  url: string;
  domain: string;
}

interface UploadedFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  uploading: boolean;
  error?: string;
}

export default function CreatePostPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'earnings_flex',
    content: '',
    earnings_amount: '',
    token_address: '',
    media_urls: [] as string[],
    social_link: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (linkTimeoutRef.current) {
        clearTimeout(linkTimeoutRef.current);
      }
    };
  }, []);

  // File upload functions
  const uploadFile = async (file: File): Promise<string> => {
    if (!isSignedIn) {
      console.error('User not authenticated for file upload');
      throw new Error('Please sign in to upload files');
    }
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type, 'User:', userId);
      
      // Check if the bucket is accessible by trying to list files
      console.log('Checking if flexstream bucket is accessible...');
      const { data: testFiles, error: testError } = await supabase.storage
        .from('flexstream')
        .list('', { limit: 1 });
      
      if (testError) {
        console.error('flexstream bucket not accessible:', testError);
        throw new Error(`Storage bucket not accessible: ${testError.message}. Please check that the "flexstream" bucket exists and is public in Supabase Dashboard → Storage.`);
      }
      
      console.log('flexstream bucket is accessible, proceeding with upload...');
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('flexstream')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('flexstream')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (files: FileList) => {
    // Check if user is authenticated
    if (!isSignedIn) {
      alert('Please sign in to upload files');
      return;
    }

    // Test Supabase connection first
    console.log('Testing Supabase connection...');
    try {
      const { data: testData, error: testError } = await supabase.from('users').select('id').limit(1);
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      console.log('Supabase connection test successful');
    } catch (error) {
      console.error('Supabase connection error:', error);
      throw new Error(`Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        alert(`Unsupported file type: ${file.type}`);
        continue;
      }
      
      // Validate file size
      const maxSize = SUPPORTED_IMAGE_TYPES.includes(file.type) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Max size: ${maxSize / (1024 * 1024)}MB`);
        continue;
      }
      
      const fileId = Math.random().toString(36).substr(2, 9);
      const fileType = SUPPORTED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video';
      
      newFiles.push({
        id: fileId,
        file,
        url: URL.createObjectURL(file), // Temporary preview URL
        type: fileType,
        uploading: true,
      });
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setUploading(true);
    
    // Upload files
    for (const fileObj of newFiles) {
      try {
        const uploadedUrl = await uploadFile(fileObj.file);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, url: uploadedUrl, uploading: false }
              : f
          )
        );
      } catch (error) {
        console.error('Upload failed for file:', fileObj.file.name, error);
        
        // Check if it's a storage bucket issue
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        const isStorageError = errorMessage.includes('Storage bucket not configured') || 
                              errorMessage.includes('Storage service unavailable');
        
        if (isStorageError) {
          // For storage errors, show a helpful message
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileObj.id 
                ? { ...f, uploading: false, error: 'Storage not configured. Please set up the post-media bucket in Supabase Dashboard → Storage.' }
                : f
            )
          );
        } else {
          // For other errors, show the actual error
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileObj.id 
                ? { ...f, uploading: false, error: errorMessage }
                : f
            )
          );
        }
      }
    }
    
    setUploading(false);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = async (fileId: string) => {
    const fileObj = uploadedFiles.find(f => f.id === fileId);
    if (!fileObj) return;

    // Reset error state and start uploading
    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, uploading: true, error: undefined }
          : f
      )
    );

    try {
      const uploadedUrl = await uploadFile(fileObj.file);
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, url: uploadedUrl, uploading: false, error: undefined }
            : f
        )
      );
    } catch (error) {
      console.error('Retry upload failed for file:', fileObj.file.name, error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, uploading: false, error: errorMessage }
            : f
        )
      );
    }
  };

  // Link preview functions
  const fetchLinkPreview = async (url: string) => {
    if (!url) return;
    
    setLinkPreviewLoading(true);
    setLinkPreview(null); // Clear previous preview
    
    try {
      console.log('Fetching link preview for:', url);
      
      // Validate URL format
      new URL(url);
      
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      console.log('Link preview response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Link preview data:', data);
        setLinkPreview(data);
      } else {
        console.error('Link preview API error:', response.status, response.statusText);
        // Fallback: create basic preview from URL
        const domain = new URL(url).hostname;
        setLinkPreview({
          title: domain,
          description: 'Link preview unavailable',
          image: '',
          url,
          domain,
        });
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
      // Fallback: create basic preview from URL
      try {
        const domain = new URL(url).hostname;
        setLinkPreview({
          title: domain,
          description: 'Link preview unavailable',
          image: '',
          url,
          domain,
        });
      } catch (urlError) {
        console.error('Invalid URL:', urlError);
        setLinkPreview({
          title: 'Invalid URL',
          description: 'Please enter a valid URL',
          image: '',
          url,
          domain: 'invalid',
        });
      }
    } finally {
      setLinkPreviewLoading(false);
    }
  };

  const handleLinkChange = (url: string) => {
    setFormData(prev => ({ ...prev, social_link: url }));
    
    // Clear previous timeout
    if (linkTimeoutRef.current) {
      clearTimeout(linkTimeoutRef.current);
    }
    
    if (url) {
      // Debounce the API call
      linkTimeoutRef.current = setTimeout(() => {
        fetchLinkPreview(url);
      }, 1000); // Wait 1 second after user stops typing
    } else {
      setLinkPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      alert('Please sign in to create a post.');
      return;
    }

    setLoading(true);
    try {
      // First, check if user has a profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('privy_user_id', userId)
        .single();

      if (profileError || !userProfile) {
        console.error('User profile not found:', profileError);
        alert('Please complete your profile setup first. Redirecting to onboarding...');
        router.push('/auth/onboarding');
        return;
      }

      // Get uploaded file URLs
      const mediaUrls = uploadedFiles
        .filter(f => !f.uploading && !f.error)
        .map(f => f.url);

      console.log('Creating post with data:', {
        user_id: userProfile.id,
        type: formData.type,
        content: formData.content,
        earnings_amount: formData.earnings_amount ? parseFloat(formData.earnings_amount) : null,
        token_address: formData.token_address || null,
        media_urls: mediaUrls,
        social_link: formData.social_link || null,
      });

      // Try to insert without social_link first to test
      const postData: any = {
        user_id: userProfile.id,
        type: formData.type,
        content: formData.content,
        earnings_amount: formData.earnings_amount ? parseFloat(formData.earnings_amount) : null,
        token_address: formData.token_address || null,
        media_urls: mediaUrls,
      };

      // Only add social_link if it exists and the column exists
      if (formData.social_link) {
        postData.social_link = formData.social_link;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Post created successfully:', data);
      router.push('/demo');
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating post: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-300 mb-6">You need to be signed in to create posts.</p>
          <Button 
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700"
            onClick={() => router.push('/auth/signin')}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Create Post</h1>
          </div>

          {/* Temporary Storage Diagnostic */}
          <div className="mb-6">
            <StorageDiagnostic />
          </div>

          {/* Temporary Supabase Test */}
          <div className="mb-6">
            <SupabaseTest />
          </div>

          {/* Temporary Link Preview Test */}
          <div className="mb-6">
            <LinkPreviewTest />
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Share Your Success</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Post Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Post Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {POST_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.type === type.id
                            ? 'border-purple-400 bg-purple-400/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <type.icon className={`w-6 h-6 mx-auto mb-2 ${type.color}`} />
                        <div className="text-white text-sm font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What's your story? *
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your trading success, stream highlights, or journey..."
                    rows={4}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                {/* Earnings Amount (for earnings_flex) */}
                {formData.type === 'earnings_flex' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Earnings Amount ($)
                    </label>
                    <Input
                      type="number"
                      value={formData.earnings_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, earnings_amount: e.target.value }))}
                      placeholder="0.00"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                )}

                {/* Token Address (for earnings_flex) */}
                {formData.type === 'earnings_flex' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Token Address (Optional)
                    </label>
                    <Input
                      value={formData.token_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, token_address: e.target.value }))}
                      placeholder="Enter token mint address"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                )}

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add Media Files
                  </label>
                  
                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">Click to upload or drag and drop</p>
                    <p className="text-gray-400 text-sm">
                      Images: JPG, PNG, GIF, WebP (max 10MB) • Videos: MP4, WebM, AVI, MOV (max 50MB)
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={SUPPORTED_FILE_TYPES.join(',')}
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  
                  {/* Uploaded Files Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                          <div className="flex-shrink-0">
                            {file.type === 'image' ? (
                              <img 
                                src={file.url} 
                                alt={file.file.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-blue-500/20 rounded flex items-center justify-center">
                                <VideoCameraIcon className="w-6 h-6 text-blue-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{file.file.name}</p>
                            <p className="text-gray-400 text-xs">
                              {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {file.uploading && (
                              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            )}
                            {file.error && (
                              <div className="flex items-center space-x-1">
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-xs max-w-32 truncate" title={file.error}>
                                  {file.error}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 border-orange-500/50 text-orange-400 hover:bg-orange-500/10 px-2 py-1 text-xs"
                                  onClick={() => retryUpload(file.id)}
                                >
                                  Retry
                                </Button>
                              </div>
                            )}
                            {!file.uploading && !file.error && (
                              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(file.id)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 p-1"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Social Link Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Social Link (Optional)
                  </label>
                  <Input
                    value={formData.social_link}
                    onChange={(e) => handleLinkChange(e.target.value)}
                    placeholder="https://twitter.com/your-post or https://youtube.com/watch?v=..."
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                  
                  {/* Link Preview */}
                  {linkPreviewLoading && (
                    <div className="mt-3 p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-300 text-sm">Loading preview...</span>
                      </div>
                    </div>
                  )}
                  
                  {linkPreview && !linkPreviewLoading && (
                    <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-start space-x-3">
                        {linkPreview.image && (
                          <img 
                            src={linkPreview.image} 
                            alt={linkPreview.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{linkPreview.title}</h4>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{linkPreview.description}</p>
                          <p className="text-emerald-400 text-xs mt-1">{linkPreview.domain}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, social_link: '' }));
                            setLinkPreview(null);
                          }}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 p-1"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
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
                    disabled={loading || !formData.content.trim()}
                    className="flexstream-gradient text-white px-8 py-2"
                  >
                    {loading ? 'Creating...' : 'Create Post'}
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
