'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const wallet = useWallet();
  const { publicKey, connected, signTransaction } = wallet;
  
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

    if (!description.trim()) {
      setError('Post description is required');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
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
      formData.append('wallet', publicKey.toString());
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
          instructions: transaction.instructions.length
        });
      } catch (deserializeError) {
        console.error('❌ Failed to deserialize transaction:', deserializeError);
        throw new Error(`Failed to deserialize transaction: ${deserializeError instanceof Error ? deserializeError.message : 'Unknown error'}`);
      }

      // IMPORTANT: Do NOT modify the transaction after it's been partially signed!
      // The backend already set the blockhash and the mint keypair already signed it.
      // We just need to add the user's signature.
      console.log('🔐 Transaction ready for user signature');

      // 3. Get transaction signed by user
      // IMPORTANT: This transaction already has a partial signature from the backend (baseMint keypair)
      // We need to add the user's signature without re-verifying the transaction
      let signedTransaction: Transaction;
      try {
        console.log('🔐 Requesting wallet signature...');
        if (!signTransaction) {
          throw new Error('Wallet does not support transaction signing');
        }

        // Try to sign the partially-signed transaction
        // Some wallets may reject this, so we handle it gracefully
        try {
          signedTransaction = await signTransaction(transaction);
          console.log('✅ Transaction signed by user (method 1)');
        } catch (partialSignError) {
          console.warn('⚠️ Wallet rejected partial signing, trying alternative method...');

          // Alternative: Create a new transaction without partial signatures
          // This requires the backend to not partial-sign
          throw new Error('Your wallet does not support signing partially-signed transactions. This is a known limitation with some wallets on devnet.');
        }
      } catch (signError) {
        console.error('❌ Signing error:', signError);
        const errorMsg = signError instanceof Error ? signError.message : 'Unknown error';

        // Check for common wallet errors
        if (errorMsg.includes('User rejected') || errorMsg.includes('rejected')) {
          throw new Error('Transaction was rejected. Please try again and approve the transaction in your wallet.');
        } else if (errorMsg.includes('Blockhash not found') || errorMsg.includes('expired')) {
          throw new Error('Transaction expired. Please try creating the post again.');
        } else if (errorMsg.includes('partially-signed')) {
          throw new Error(errorMsg);
        } else {
          throw new Error(`Failed to sign transaction: ${errorMsg}`);
        }
      }

      // 4. Send to backend for confirmation and database save
      setCurrentStep('confirming');
      setProgress('Submitting transaction to Solana...');

      const confirmResponse = await fetch('/api/posts/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Serialize with requireAllSignatures: false because we only have user signature
          // Backend will add baseMint signature before submitting to Solana
          signedTransaction: Buffer.from(signedTransaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
          })).toString('base64'),
          title,
          content: description,
          mediaUrls: result.data.post.media_urls,
          walletAddress: publicKey.toString(),
          ticker: ticker.toUpperCase(),
          mint: result.data.token.mint,
          pool: result.data.token.pool,
          metadataUri: result.data.token.metadataUri,
          baseMintKeypair: result.data.token.baseMintKeypair,  // Pass keypair to backend for signing
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        console.error('❌ Confirm Error:', errorData);
        throw new Error(errorData.error || `Failed to confirm transaction (${confirmResponse.status})`);
      }

      const confirmResult = await confirmResponse.json();

      console.log('✅ Transaction confirmed and saved:', confirmResult);

      setCurrentStep('complete');
      setProgress('Post and token created successfully!');

      // Show success toast with explorer link
      toast.success('Post and token created successfully!', {
        description: `Token ${ticker.toUpperCase()} is now live and tradable`,
        duration: 5000,
        action: confirmResult.data?.explorerUrl ? {
          label: 'View on Explorer',
          onClick: () => window.open(confirmResult.data.explorerUrl, '_blank')
        } : undefined
      });

      // Success!
      setTimeout(() => {
        onSuccess?.();
        onClose();
        router.push('/'); // Navigate to home feed
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
            disabled={currentStep !== 'idle' && currentStep !== 'error'}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
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
              placeholder="e.g., My Epic Trading Journey"
              disabled={currentStep !== 'idle'}
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
              placeholder="e.g., TRADE"
              disabled={currentStep !== 'idle'}
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
              disabled={currentStep !== 'idle'}
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
                currentStep !== 'idle' && "opacity-50 pointer-events-none"
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
              
              {/* Browse Button */}
              <span
                className={cn(
                  "inline-block px-5 py-2 rounded-lg border border-white/20 bg-white/5 text-primary text-sm font-medium transition-all",
                  files.length === 0 && "hover:bg-white/10"
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

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex-shrink-0">
          {/* Token Creation Info */}
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-400 mb-1">
                  Automatic Token Launch
                </p>
                <p className="text-xs text-secondary">
                  A tradable token will be created on Solana (via Meteora DBC) and linked to your post. 
                  Instantly tradable on Jupiter & Meteora!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={currentStep !== 'idle' && currentStep !== 'error'}
              className="flex-1 border-white/20 text-secondary hover:bg-card-bg/80 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreatePost}
              disabled={currentStep !== 'idle' || !title || !ticker || !description || files.length === 0 || !connected}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {currentStep === 'idle' ? (
                <>
                  <RocketLaunchIcon className="w-5 h-5" />
                  Launch Post & Token
                </>
              ) : currentStep === 'complete' ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Complete!
                </>
              ) : (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
  );
}