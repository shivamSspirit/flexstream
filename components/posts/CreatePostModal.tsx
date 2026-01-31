'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWalletCompat';
import { useQueryClient } from '@tanstack/react-query';
import { useAddPostToCache } from '@/hooks/usePosts';
import { Button } from '@/components/ui/button';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Transaction, Connection } from '@solana/web3.js';

interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  sizeFormatted: string;
}

interface FileError {
  fileName: string;
  error: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  maxFiles?: number;
  maxSizeGB?: number;
}

const FREE_LAUNCH_LIMIT = 10;

export function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  maxFiles = 1,
  maxSizeGB = 6
}: CreatePostModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addPostToCache = useAddPostToCache();
  const { publicKey, connected, signTransaction } = useWallet();

  // File upload state
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<FileError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticker, setTicker] = useState('');

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState('');

  // Launch count tracking
  const [launchCount, setLaunchCount] = useState<number>(0);
  const [isLoadingLaunchCount, setIsLoadingLaunchCount] = useState(true);
  const requiresSignature = launchCount >= FREE_LAUNCH_LIMIT;
  const remainingFreeLaunches = Math.max(0, FREE_LAUNCH_LIMIT - launchCount);

  // Fetch launch count when modal opens
  useEffect(() => {
    const fetchLaunchCount = async () => {
      if (!isOpen || !publicKey || !connected) {
        setIsLoadingLaunchCount(false);
        return;
      }

      try {
        setIsLoadingLaunchCount(true);
        const response = await fetch(`/api/users/stats?wallet=${publicKey.toBase58()}`);
        if (response.ok) {
          const data = await response.json();
          setLaunchCount(data.post_launch_count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch launch count:', error);
      } finally {
        setIsLoadingLaunchCount(false);
      }
    };

    fetchLaunchCount();
  }, [isOpen, publicKey, connected]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [files]);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up file URLs
      files.forEach(file => URL.revokeObjectURL(file.url));
      // Reset all state
      setFiles([]);
      setErrors([]);
      setIsDragOver(false);
      setIsCreating(false);
      setProgress('');
      setTitle('');
      setDescription('');
      setTicker('');
    } else {
      console.log('🚀 CreatePostModal opened');
      console.log('🚀 File input ref:', fileInputRef.current);
      console.log('🚀 Max files:', maxFiles);
      console.log('🚀 Connected wallet:', publicKey?.toBase58());
    }
  }, [isOpen, maxFiles, maxSizeGB, publicKey]);

  // Helper: Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper: Validate file type
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'
    ];
    return validTypes.includes(file.type);
  };

  // Helper: Get file type category
  const getFileType = (file: File): 'image' | 'video' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'audio';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log('📁 Files dropped:', droppedFiles.length);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't preventDefault on file input onChange - it blocks file selection!
    console.log('🎯 handleFileSelect triggered');
    console.log('🎯 Event target:', e.target);
    console.log('🎯 Files from event:', e.target.files);
    
    const selectedFiles = Array.from(e.target.files || []);
    console.log('📁 Files selected:', selectedFiles.length, selectedFiles);
    
    if (selectedFiles.length === 0) {
      console.warn('⚠️ No files selected');
      return;
    }
    
    addFiles(selectedFiles);
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    
    setErrors([]); // Clear previous errors
    
    const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;
    const newErrors: FileError[] = [];
    const validFiles: File[] = [];
    
    console.log(`📊 Processing ${newFiles.length} file(s)...`);
    console.log(`📊 Current files: ${files.length}, Max allowed: ${maxFiles}`);
    
    // Check if adding these files would exceed max count
    if (files.length >= maxFiles) {
      setErrors([{ 
        fileName: 'Multiple files', 
        error: `Maximum ${maxFiles} file(s) allowed. Remove existing files first.` 
      }]);
      return;
    }
    
    // Process each file
    newFiles.forEach(file => {
      console.log(`🔍 Checking: ${file.name} (${formatFileSize(file.size)}, ${file.type})`);
      
      // Check file count limit
      if (files.length + validFiles.length >= maxFiles) {
        newErrors.push({ 
          fileName: file.name, 
          error: `Maximum ${maxFiles} file(s) allowed` 
        });
        return;
      }
      
      // Check file size
      if (file.size > maxSizeBytes) {
        newErrors.push({ 
          fileName: file.name, 
          error: `File too large (max ${maxSizeGB}GB). Size: ${formatFileSize(file.size)}` 
        });
        console.error(`❌ ${file.name}: Too large`);
        return;
      }
      
      // Check file size is not 0
      if (file.size === 0) {
        newErrors.push({ 
          fileName: file.name, 
          error: 'File is empty (0 bytes)' 
        });
        console.error(`❌ ${file.name}: Empty file`);
        return;
      }
      
      // Check file type
      if (!isValidFileType(file)) {
        newErrors.push({ 
          fileName: file.name, 
          error: `Invalid file type: ${file.type}. Supported: images, videos, audio` 
        });
        console.error(`❌ ${file.name}: Invalid type (${file.type})`);
        return;
      }
      
      // File is valid
      validFiles.push(file);
      console.log(`✅ ${file.name}: Valid`);
    });
    
    // Update errors state
    if (newErrors.length > 0) {
      setErrors(newErrors);
      console.error(`❌ ${newErrors.length} file(s) rejected`);
    }
    
    // Create previews for valid files
    if (validFiles.length > 0) {
    const filePreviews: FilePreview[] = validFiles.map(file => {
      const preview: FilePreview = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        url: URL.createObjectURL(file),
          type: getFileType(file),
          size: file.size,
          sizeFormatted: formatFileSize(file.size)
      };
        console.log(`📎 Created preview for: ${file.name}`);
      return preview;
    });

    setFiles(prev => {
      const newFilesList = [...prev, ...filePreviews];
        console.log(`✅ Total files now: ${newFilesList.length}`);
        return newFilesList;
      });
    }
  };

  const removeFile = (id: string) => {
    setErrors([]); // Clear errors when removing files
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
        console.log(`🗑️ Removed: ${fileToRemove.file.name}`);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleCreatePost = async () => {
    // Validate required fields
    if (!title.trim()) {
      setErrors([{ fileName: 'Validation', error: 'Post title is required' }]);
      return;
    }

    if (!ticker.trim()) {
      setErrors([{ fileName: 'Validation', error: 'Token ticker is required' }]);
      return;
    }

    if (!description.trim()) {
      setErrors([{ fileName: 'Validation', error: 'Post description is required' }]);
      return;
    }

    if (files.length === 0) {
      setErrors([{ fileName: 'Validation', error: 'Please upload at least one image' }]);
      return;
    }

    if (!connected || !publicKey) {
      setErrors([{ fileName: 'Wallet', error: 'Please connect your wallet first' }]);
      return;
    }

    setIsCreating(true);
    setErrors([]);

    try {
      // Create FormData with all required fields
      const formData = new FormData();
      formData.append('title', title);
      formData.append('ticker', ticker.toUpperCase());
      formData.append('content', description);
      formData.append('wallet', publicKey.toBase58());
      formData.append('username', 'user'); // Will be looked up by wallet

      // Add all media files
      for (const filePreview of files) {
        formData.append('media', filePreview.file);
      }

      // Choose endpoint based on whether signature is required
      if (requiresSignature) {
        // SIGNED FLOW: User has exceeded free launches
        setProgress('Preparing transaction...');
        console.log('🚀 Using signed flow (launches exceeded)...');

        // Step 1: Get unsigned transaction
        const response = await fetch('/api/posts/create-signed', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to prepare transaction');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to prepare transaction');
        }

        const { unsignedTransaction, pendingPost } = result.data;

        // Step 2: Sign the transaction
        setProgress('Please sign the transaction...');
        console.log('✍️ Signing transaction...');

        const transactionBuffer = Buffer.from(unsignedTransaction.transaction, 'base64');
        const transaction = Transaction.from(transactionBuffer);

        const signedTransaction = await signTransaction(transaction);

        console.log('✅ Transaction signed');

        // Step 3: Send to Solana
        setProgress('Submitting to blockchain...');
        console.log('📤 Submitting to Solana...');

        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
          'confirmed'
        );

        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          }
        );

        console.log('📝 Transaction submitted:', signature);

        // Step 4: Wait for confirmation
        setProgress('Confirming transaction...');

        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash: unsignedTransaction.blockhash,
            lastValidBlockHeight: unsignedTransaction.lastValidBlockHeight,
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('✅ Transaction confirmed!');

        // Step 5: Confirm with backend
        setProgress('Saving post...');

        const confirmResponse = await fetch('/api/posts/confirm-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signature,
            pendingPost: {
              ...pendingPost,
              unsignedTransaction,
            },
          }),
        });

        const confirmResult = await confirmResponse.json();

        if (!confirmResponse.ok || !confirmResult.success) {
          console.warn('⚠️ Post created but confirmation failed:', confirmResult);
        } else {
          // Add the post directly to cache using the confirmation response data
          if (confirmResult.data?.post) {
            console.log('📝 Adding post to cache with user data:', confirmResult.data.post);
            addPostToCache(confirmResult.data.post);
          }
        }

        console.log('✅ Post created successfully:', confirmResult.data);

      } else {
        // GASLESS FLOW: Free launches remaining
        setProgress('Uploading media and creating token...');
        console.log('🚀 Using gasless flow...');

        const response = await fetch('/api/posts/create', {
          method: 'POST',
          body: formData,
        });

        setProgress('Processing response...');

        if (!response.ok) {
          const errorData = await response.json();

          // Check if it's a free launches exhausted error
          if (errorData.code === 'FREE_LAUNCHES_EXHAUSTED') {
            setLaunchCount(errorData.details?.launchCount || FREE_LAUNCH_LIMIT);
            throw new Error(errorData.details?.message || 'Free launches exhausted. Please sign to continue.');
          }

          throw new Error(errorData.error || 'Failed to create post');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create post');
        }

        console.log('✅ Post created successfully:', result.data);

        // Update local launch count from response
        if (result.data.launchInfo) {
          setLaunchCount(result.data.launchInfo.currentCount);
        }

        // Add the post directly to cache using the API response data
        // This ensures the post appears immediately with correct user data
        if (result.data.post) {
          console.log('📝 Adding post to cache with user data:', result.data.post);
          addPostToCache(result.data.post);
        }
      }

      setProgress('Complete! ✅');

      // Mark queries as stale for eventual consistency
      // Don't force refetch - let the optimistic update show the post immediately
      console.log('🔄 Marking posts queries as stale...');
      await queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'none' });
      await queryClient.invalidateQueries({ queryKey: ['userStats'] });

      // Success!
      setTimeout(() => {
        setProgress('');
        onSuccess?.();
        onClose();
        router.push('/'); // Navigate to home feed
      }, 1000);

    } catch (error) {
      console.error('❌ Error creating post:', error);
      setErrors([{
        fileName: 'Creation Error',
        error: error instanceof Error ? error.message : 'Failed to create post and token'
      }]);
      setProgress('');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-app-bg rounded-3xl border border-white/10 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <RocketLaunchIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-primary">
              Create Post & Launch Token
          </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Progress Indicator */}
          {progress && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400 font-medium text-sm">{progress}</p>
              </div>
            </div>
          )}

          {/* Post Title Input */}
          <div className="mb-4">
            <label htmlFor="post-title" className="block text-sm font-semibold text-primary mb-2">
              Post Title *
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Epic Pump.fun Trade"
              disabled={isCreating}
              maxLength={100}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <p className="text-xs text-secondary mt-1">{title.length}/100 characters</p>
          </div>

          {/* Token Ticker Input */}
          <div className="mb-4">
            <label htmlFor="token-ticker" className="block text-sm font-semibold text-primary mb-2">
              Token Ticker *
            </label>
            <input
              id="token-ticker"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g., PUMP"
              disabled={isCreating}
              maxLength={10}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 uppercase font-mono"
            />
            <p className="text-xs text-secondary mt-1">3-10 characters, letters and numbers only</p>
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <label htmlFor="post-description" className="block text-sm font-semibold text-primary mb-2">
              Description *
            </label>
            <textarea
              id="post-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story behind this post and token..."
              disabled={isCreating}
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-secondary mt-1">{description.length}/500 characters</p>
          </div>

          {/* File Upload Section */}
          <div className="mb-4">
            <p className="block text-sm font-semibold text-primary mb-3">
              Upload Image/Video *
          </p>

          {/* Upload Area */}
            <label
              htmlFor="file-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "block border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-app-bg",
              isDragOver 
                  ? "border-purple-400 bg-purple-500/10 scale-[1.02]" 
                  : "border-white/20 hover:border-white/30 hover:bg-white/5",
                isCreating && "opacity-50 pointer-events-none",
                files.length >= maxFiles && "cursor-not-allowed opacity-60"
              )}
            >
              {/* Icon */}
            <div className={cn(
                "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-3 transition-transform",
                isDragOver && "scale-110",
                "from-purple-500 to-pink-500 shadow-lg"
              )}>
                <CloudArrowUpIcon className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            
              {/* Heading */}
              <p className="text-primary font-medium text-sm mb-3">
                {isDragOver ? "Drop your file here" : files.length > 0 ? "File uploaded ✓" : "Drag & drop or choose file"}
              </p>
              
              {/* Browse Button - Styled span */}
              <span
                className={cn(
                  "inline-block px-5 py-2 rounded-lg border border-white/20 bg-white/5 text-primary text-sm font-medium transition-all",
                  files.length === 0 && "hover:bg-white/10",
                  files.length >= maxFiles && "opacity-50"
                )}
                aria-hidden="true"
              >
                {files.length > 0 ? "Change File" : "Choose File"}
              </span>
              
              {/* Hidden file input */}
            <input
                id="file-upload"
              ref={fileInputRef}
              type="file"
                multiple={maxFiles > 1}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp3,audio/wav"
              onChange={handleFileSelect}
                disabled={isCreating}
                className="sr-only"
                aria-label="Choose a file to upload"
            />
            </label>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm mb-2">
                    {errors.length === 1 ? 'File Error:' : `${errors.length} File Errors:`}
                  </p>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-300 text-xs">
                        <span className="font-medium">{error.fileName}:</span> {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setErrors([])}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  aria-label="Dismiss errors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {files.length > 0 && errors.length === 0 && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm font-medium">
                ✅ {files.length} file(s) ready to upload
              </p>
            </div>
          )}

          {/* File Previews - Compact */}
          {files.length > 0 && (
            <div className="mt-4">
                {files.map((file) => (
                <div 
                  key={file.id} 
                  className="relative group bg-card-bg rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  <div className="flex gap-3 p-3">
                    {/* Preview Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/5">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={`Preview of ${file.file.name}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : file.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                          <VideoCameraIcon className="w-6 h-6 text-blue-400" aria-hidden="true" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                          <MusicalNoteIcon className="w-6 h-6 text-green-400" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate mb-1" title={file.file.name}>
                        {file.file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="capitalize">{file.type}</span>
                        <span>•</span>
                        <span className="font-mono">{file.sizeFormatted}</span>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      disabled={isCreating}
                      className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label={`Remove ${file.file.name}`}
                    >
                      <XMarkIcon className="w-4 h-4 text-red-400" aria-hidden="true" />
                    </button>
                  </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex-shrink-0">
          {/* Launch Count Warning */}
          {!isLoadingLaunchCount && requiresSignature && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <ExclamationCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-400 mb-1">
                    Signature Required
                  </p>
                  <p className="text-xs text-secondary">
                    You&apos;ve used all {FREE_LAUNCH_LIMIT} free gasless launches.
                    You&apos;ll need to sign and pay for the token creation transaction (~0.01 SOL).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Token Creation Info */}
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-400 mb-1">
                  {requiresSignature ? 'Token Launch (Signed)' : 'Automatic Token Launch'}
                </p>
                <p className="text-xs text-secondary">
                  A tradable token will be created on Solana (via Meteora DBC) and linked to your post.
                  Instantly tradable on Jupiter & Meteora!
                </p>
                {!isLoadingLaunchCount && !requiresSignature && (
                  <p className="text-xs text-green-400 mt-1 font-medium">
                    {remainingFreeLaunches} free gasless launch{remainingFreeLaunches !== 1 ? 'es' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 border-white/20 text-secondary hover:bg-card-bg/80 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreatePost}
              disabled={isCreating || !title || !ticker || !description || files.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="w-5 h-5" />
                  Launch Post & Token
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}