'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
// import { usePrivy, useWallets } from '@privy-io/react-auth';
// import { useSignTransaction } from '@privy-io/react-auth/solana';
import { Transaction, Connection, clusterApiUrl } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInvalidatePosts } from '@/hooks/usePosts';

import { 
  XMarkIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  sizeFormatted: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type CreationStep = 'idle' | 'uploading' | 'creating' | 'signing' | 'confirming' | 'complete' | 'error';

export function CreatePostModal({
  isOpen,
  onClose,
  onSuccess
}: CreatePostModalProps) {
  const router = useRouter();
  const { connected, publicKey, sendTransaction } = useWallet();
  // const { authenticated } = usePrivy();
  // const { wallets } = useWallets();
  // const { signTransaction } = useSignTransaction();
  const invalidatePosts = useInvalidatePosts();

  // TODO: Add authentication and wallet connection
  const authenticated = false;
  const solanaWallet = null;

  // Debug wallet connection state
  useEffect(() => {
    console.log('🔍 [CreatePostModal] Wallet state:', {
      connected,
      publicKey: publicKey?.toBase58(),
      hasPublicKey: !!publicKey,
      hasSendTransaction: !!sendTransaction
    });
  }, [connected, publicKey, sendTransaction]);

  // Create Solana connection for devnet
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
  const connection = new Connection(rpcUrl, 'confirmed');

  // Debug connection
  useEffect(() => {
    console.log('🔗 [CreatePostModal] Solana connection:', {
      rpcUrl,
      endpoint: connection.rpcEndpoint,
      commitment: connection.commitment,
      isDevnet: connection.rpcEndpoint.includes('devnet')
    });
  }, [rpcUrl]);
  
  // File upload state
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Post data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticker, setTicker] = useState('');
  
  // Creation state
  const [currentStep, setCurrentStep] = useState<CreationStep>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);

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
      // Reset all state
      setFiles((prevFiles) => {
        // Clean up file URLs before clearing
        prevFiles.forEach(file => URL.revokeObjectURL(file.url));
        return [];
      });
      setIsDragOver(false);
      setCurrentStep('idle');
      setProgress('');
      setError(null);
      setTitle('');
      setDescription('');
      setTicker('');
      setTokenData(null);
    }
  }, [isOpen]); // Only depend on isOpen, not files

  // Helper: Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    addFiles(selectedFiles);
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    
    setError(null);
    
    const maxSizeBytes = 6 * 1024 * 1024 * 1024; // 6GB
    const validFiles: File[] = [];
    
    // Process each file
    newFiles.forEach(file => {
      // Check file size
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} is too large (max 6GB)`);
        return;
      }
      
      // Check file size is not 0
      if (file.size === 0) {
        setError(`File ${file.name} is empty`);
        return;
      }
      
      // File is valid
      validFiles.push(file);
    });
    
    // Create previews for valid files
    if (validFiles.length > 0) {
      const filePreviews: FilePreview[] = validFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        url: URL.createObjectURL(file),
        type: getFileType(file),
        size: file.size,
        sizeFormatted: formatFileSize(file.size)
      }));

      setFiles(prev => [...prev, ...filePreviews]);
    }
  };

  const removeFile = (id: string) => {
    setError(null);
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleCreatePost = async () => {
    // Validate required fields
    if (!title.trim()) {
      setError('Post title is required');
      return;
    }

    if (!ticker.trim()) {
      setError('Token ticker is required');
      return;
    }

    if (ticker.trim().length < 3) {
      setError('Token ticker must be at least 3 characters');
      return;
    }

    if (ticker.trim().length > 10) {
      setError('Token ticker must be 10 characters or less');
      return;
    }

    if (!description.trim()) {
      setError('Post description is required');
      return;
    }

    if (files.length === 0) {
      setError('At least one media file (image/video) is required');
      return;
    }

    if (!connected || !publicKey) {
      setError('Please connect your wallet to create a post and launch a token.');
      return;
    }

    setCurrentStep('uploading');
    setError(null);
    setProgress('Uploading media and creating token...');

    try {
      // 1. Create post and token via API
      const formData = new FormData();
      formData.append('title', title);
      formData.append('ticker', ticker.toUpperCase());
      formData.append('content', description);
      formData.append('wallet', publicKey.toBase58());
      formData.append('username', 'user'); // TODO: Get actual username
      
      // Append all media files (extract File object from FilePreview)
      files.forEach(filePreview => {
        formData.append('media', filePreview.file);
      });

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `Failed to create post (${response.status})`);
      }

      const result = await response.json();

      console.log('📦 API Response:', result);
      console.log('📋 Response structure:', {
        success: result.success,
        requiresSignature: result.requiresSignature,
        hasData: !!result.data,
        hasToken: !!result.data?.token,
        hasTransaction: !!result.data?.token?.transaction
      });

      // Check if the backend is asking for signature
      if (!result.success || !result.requiresSignature) {
        console.error('❌ Unexpected response format:', result);
        throw new Error('Unexpected response format from server');
      }

      console.log('✅ Transaction prepared:', result);

      setTokenData(result.data);
      setCurrentStep('signing');
      setProgress('Please sign the transaction in your wallet...');

      // 2. Deserialize the transaction
      let transaction: Transaction;
      try {
        console.log('📦 Deserializing transaction...');
        transaction = Transaction.from(Buffer.from(result.data.token.transaction, 'base64'));
        console.log('✅ Transaction deserialized successfully');
        console.log('📋 Transaction info:', {
          hasFeePayer: !!transaction.feePayer,
          hasRecentBlockhash: !!transaction.recentBlockhash,
          signatures: transaction.signatures.length,
          instructions: transaction.instructions.length,
          feePayer: transaction.feePayer?.toBase58(),
          signers: transaction.signatures.map((sig, index) => ({
            index,
            signature: sig.signature ? 'present' : 'missing',
            publicKey: sig.publicKey?.toBase58()
          }))
        });
      } catch (deserializeError) {
        console.error('❌ Failed to deserialize transaction:', deserializeError);
        throw new Error(`Failed to deserialize transaction: ${deserializeError instanceof Error ? deserializeError.message : 'Unknown error'}`);
      }

      // 3. Send the partially-signed transaction using sendTransaction
      // This handles signing and sending in one step, avoiding wallet compatibility issues
      console.log('🔐 Sending transaction with user signature...');
      console.log('📊 Transaction state before sending:', {
        signatures: transaction.signatures.map((s: any) => ({
          pubkey: s.publicKey?.toBase58(),
          hasSig: !!s.signature
        }))
      });

      setCurrentStep('signing');
      setProgress('Please approve the transaction in your wallet...');

      let signature: string;

      try {
        if (!sendTransaction) {
          throw new Error('Wallet does not support sending transactions. Please try a different wallet.');
        }

        // Send the transaction - wallet will sign it and send to the network
        // The transaction already has the baseMint signature, wallet adds user signature
        signature = await sendTransaction(transaction, connection);
        console.log('✅ Transaction sent successfully:', signature);

      } catch (sendError) {
        console.error('❌ Transaction send failed:', sendError);
        throw new Error(`Transaction send failed: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`);
      }

      // 4. Wait for confirmation and save to database
      setCurrentStep('confirming');
      setProgress('Waiting for blockchain confirmation...');

      console.log('⏳ Waiting for transaction confirmation...');

      try {
        // Wait for confirmation with timeout
        const latestBlockhash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed on chain: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('✅ Transaction confirmed on chain');

      } catch (confirmError) {
        console.error('❌ Confirmation error:', confirmError);
        throw new Error(`Failed to confirm transaction: ${confirmError instanceof Error ? confirmError.message : 'Unknown error'}`);
      }

      // 5. Save post and token data to database
      console.log('💾 Saving post and token data...');

      const confirmResponse = await fetch('/api/posts/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: signature,
          postData: {
            title,
            ticker: ticker.toUpperCase(),
            content: description,
            wallet: publicKey.toBase58(),
            mediaUrls: result.data.post.media_urls,
            mint: result.data.token.mint,
            pool: result.data.token.pool,
            metadataUri: result.data.token.metadataUri,
          }
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        console.error('❌ Database save error:', errorData);
        // Don't throw - transaction is already confirmed on chain
        console.warn('⚠️ Post created on-chain but failed to save to database');
      } else {
        const confirmResult = await confirmResponse.json();
        console.log('✅ Post saved to database:', confirmResult);
      }

      // 5. Complete the process
      setCurrentStep('complete');
      setProgress('Post and token created successfully!');

      // Invalidate posts to refresh the feed
      invalidatePosts();

      // Show success message
      toast.success('Post and token created successfully!', {
        description: `Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`
      });

      // Close modal after a short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Error creating post:', error);
      setCurrentStep('error');
      setError(error instanceof Error ? error.message : 'Failed to create post and token');
      setProgress('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center sm:items-start justify-center sm:p-4 overflow-y-auto z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Full screen on mobile, card on desktop */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-gradient-to-br from-app-bg via-card-bg to-app-bg sm:rounded-3xl border-0 sm:border border-white/10 shadow-2xl shadow-accent-purple/10 sm:animate-in sm:fade-in-0 sm:zoom-in-95 duration-300 sm:my-8 sm:max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-transparent via-accent-purple/5 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl blur-md opacity-50"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-lg">
                <RocketLaunchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue truncate">
                Create Post & Launch Token
              </h2>
              <p className="text-xs text-text-muted font-medium mt-0.5 hidden sm:block">
                Share your story and create a tradable token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={currentStep !== 'idle' && currentStep !== 'error'}
            className="btn-icon w-10 h-10 sm:w-11 sm:h-11 disabled:opacity-30 flex-shrink-0"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Mobile Optimized Padding */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* Progress Indicator */}
          {currentStep !== 'idle' && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                {currentStep === 'complete' ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                ) : currentStep === 'error' ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                <p className={cn(
                  "font-medium text-sm",
                  currentStep === 'complete' ? "text-green-400" : 
                  currentStep === 'error' ? "text-red-400" : "text-blue-400"
                )}>
                  {progress}
                </p>
              </div>
            </div>
          )}

          {/* Wallet Connection Status */}
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <p className="text-sm text-primary">
                {connected ? `Wallet Connected: ${publicKey?.toBase58().slice(0, 8)}...${publicKey?.toBase58().slice(-8)}` : 'Wallet Not Connected'}
              </p>
            </div>
            {!connected && (
              <p className="text-xs text-secondary mt-1">
                Please connect your wallet using the button in the header to create posts and launch tokens.
              </p>
            )}
          </div>

          {/* Post Title Input */}
          <div className="mb-5">
            <label htmlFor="post-title" className="block text-sm font-bold text-text-primary mb-2.5 uppercase tracking-wide">
              Post Title *
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Epic Trading Journey"
              disabled={currentStep !== 'idle'}
              maxLength={100}
              required
              className="w-full px-5 py-3.5 bg-card-bg border-2 border-white/10 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 transition-all disabled:opacity-50 hover:border-white/20 font-semibold"
            />
            <p className="text-xs text-text-muted mt-2 font-medium">{title.length}/100 characters</p>
          </div>

          {/* Token Ticker Input */}
          <div className="mb-5">
            <label htmlFor="token-ticker" className="block text-sm font-bold text-text-primary mb-2.5 uppercase tracking-wide">
              Token Ticker *
            </label>
            <div className="relative">
              <input
                id="token-ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g., TRADE"
                disabled={currentStep !== 'idle'}
                maxLength={10}
                minLength={3}
                required
                className="w-full px-5 py-3.5 bg-gradient-to-br from-accent-green/5 to-accent-cyan/5 border-2 border-accent-green/20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50 transition-all disabled:opacity-50 uppercase font-mono font-bold text-lg hover:border-accent-green/30"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-green text-xs font-bold px-2 py-1 bg-accent-green/10 rounded-md">
                ${ticker || 'XXX'}
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2 font-medium">3-10 characters, letters and numbers only</p>
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <label htmlFor="post-description" className="block text-sm font-bold text-text-primary mb-2.5 uppercase tracking-wide">
              Description *
            </label>
            <textarea
              id="post-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story behind this post and token..."
              disabled={currentStep !== 'idle'}
              maxLength={500}
              rows={4}
              required
              className="w-full px-5 py-3.5 bg-card-bg border-2 border-white/10 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all disabled:opacity-50 resize-none hover:border-white/20 leading-relaxed"
            />
            <p className="text-xs text-text-muted mt-2 font-medium">{description.length}/500 characters</p>
          </div>

          {/* File Upload Section */}
          <div className="mb-4">
            <p className="block text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">
              Upload Image/Video *
            </p>

            {/* Upload Area */}
            <label
              htmlFor="file-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "block border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-pink/30 focus-within:ring-offset-2 focus-within:ring-offset-app-bg",
                isDragOver
                  ? "border-accent-pink bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 scale-[1.02] shadow-lg shadow-accent-pink/20"
                  : "border-white/20 hover:border-accent-pink/40 hover:bg-gradient-to-br hover:from-accent-purple/5 hover:to-accent-pink/5",
                currentStep !== 'idle' && "opacity-50 pointer-events-none"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                isDragOver && "scale-110 rotate-6"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl blur-lg opacity-50"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl flex items-center justify-center shadow-xl">
                  <CloudArrowUpIcon className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
              </div>

              {/* Heading */}
              <p className="text-text-primary font-bold text-base mb-2">
                {isDragOver ? "Drop your file here" : files.length > 0 ? "File uploaded ✓" : "Drag & drop or choose file"}
              </p>
              <p className="text-text-muted text-sm mb-4 font-medium">
                Images, videos up to 6GB
              </p>

              {/* Browse Button */}
              <span
                className={cn(
                  "inline-block px-6 py-3 rounded-xl border-2 border-accent-pink/30 bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 text-text-primary text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 hover:border-accent-pink/50",
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
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp3,audio/wav"
                onChange={handleFileSelect}
                disabled={currentStep !== 'idle'}
                className="sr-only"
                aria-label="Choose a file to upload"
              />
            </label>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm mb-1">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  aria-label="Dismiss error"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {files.length > 0 && !error && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm font-medium">
                ✅ {files.length} file(s) ready to upload
              </p>
            </div>
          )}

          {/* File Previews */}
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
                      disabled={currentStep !== 'idle'}
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

        {/* Footer - Mobile Optimized */}
        <div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0">
          {/* Token Creation Info */}
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 glass-card border-brand-primary/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-brand-primary mb-1">
                  Automatic Token Launch
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  A tradable token will be created on Solana (via Meteora DBC) and linked to your post.
                  Instantly tradable on Jupiter & Meteora!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Stack */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={currentStep !== 'idle' && currentStep !== 'error'}
              className="btn-ghost w-full sm:flex-1 disabled:opacity-30 font-bold h-12 sm:h-auto"
            >
              Cancel
            </Button>
            <div className="relative sm:flex-[2]">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue rounded-xl blur-md opacity-50"></div>
              <Button
                type="button"
                onClick={handleCreatePost}
                disabled={currentStep !== 'idle' || !title.trim() || !ticker.trim() || ticker.trim().length < 3 || !description.trim() || files.length === 0 || !connected}
                className="relative w-full bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 sm:gap-2.5 px-6 py-3 sm:py-3.5 h-12 sm:h-auto rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] text-sm sm:text-base"
              >
                {currentStep === 'idle' ? (
                  <>
                    <RocketLaunchIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Launch Post & Token</span>
                    <span className="sm:hidden">Launch</span>
                  </>
                ) : currentStep === 'complete' ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Complete!
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    {currentStep === 'uploading' ? 'Creating...' :
                     currentStep === 'signing' ? 'Signing...' :
                     currentStep === 'confirming' ? 'Confirming...' : 'Processing...'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}