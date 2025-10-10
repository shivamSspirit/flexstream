'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  XMarkIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio';
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export function CreatePostModal({ isOpen, onClose, onUpload }: CreatePostModalProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [files]);

  // Reset files when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setIsDragOver(false);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', droppedFiles);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    console.log('Files selected:', selectedFiles);
    addFiles(selectedFiles);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    console.log('Adding files:', newFiles);
    const validFiles = newFiles.filter(file => {
      const maxSize = 6 * 1024 * 1024 * 1024; // 6GB
      const maxFiles = 15;
      const isValid = file.size <= maxSize && files.length + newFiles.length <= maxFiles;
      console.log(`File ${file.name}: size=${file.size}, valid=${isValid}`);
      return isValid;
    });

    console.log('Valid files:', validFiles);

    const filePreviews: FilePreview[] = validFiles.map(file => {
      const preview: FilePreview = {
        id: Math.random().toString(36).substring(2, 11),
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'audio'
      };
      console.log('Created preview:', preview);
      return preview;
    });

    setFiles(prev => {
      const newFilesList = [...prev, ...filePreviews];
      console.log('Updated files list:', newFilesList);
      return newFilesList;
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleGenerate = () => {
    if (files.length > 0) {
      onUpload(files.map(f => f.file));
      setFiles([]);
      onClose();
    }
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files.map(f => f.file));
      setFiles([]);
      onClose();
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="w-8 h-8" />;
      case 'video':
        return <VideoCameraIcon className="w-8 h-8" />;
      case 'audio':
        return <MusicalNoteIcon className="w-8 h-8" />;
      default:
        return <CloudArrowUpIcon className="w-8 h-8" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-app-bg rounded-3xl border border-white/10 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 my-8 max-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-primary text-center flex-1">
            Upload Imagination
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Instructions */}
          <p className="text-secondary text-center mb-6 text-sm">
            Drag or select up to 15 photos or videos to create a coin. Max 6GB.
          </p>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-12 text-center transition-all duration-200 cursor-pointer",
              isDragOver 
                ? "border-purple-400 bg-purple-500/10 scale-105" 
                : "border-white/20 hover:border-white/30 hover:bg-white/5"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 transition-transform",
              isDragOver ? "scale-110" : "group-hover:scale-105",
              "from-purple-500 to-pink-500"
            )}>
              <CloudArrowUpIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <h3 className="text-primary font-semibold text-lg mb-2">
              {isDragOver ? "Drop your files here" : "Drag & Drop or Browse"}
            </h3>
            
            <p className="text-secondary text-sm mb-4">
              Support for images, videos, and audio files
            </p>
            
            <Button
              variant="outline"
              className="bg-white/5 border-white/20 text-primary hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File upload input"
            />
          </div>

          {/* Debug Info */}
          {files.length > 0 && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ {files.length} file(s) successfully loaded
              </p>
            </div>
          )}

          {/* File Previews */}
          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="text-primary font-semibold mb-4">
                Selected Files ({files.length}/15)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-card-bg border border-white/10">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : file.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                          <VideoCameraIcon className="w-8 h-8 text-blue-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                          <MusicalNoteIcon className="w-8 h-8 text-green-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-3 h-3 text-white" />
                    </button>
                    
                    {/* File Name */}
                    <p className="text-xs text-secondary mt-2 truncate">
                      {file.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 text-secondary hover:bg-card-bg/80"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={files.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}