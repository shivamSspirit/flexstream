/**
 * useFileUpload Hook
 * Handles file upload logic with validation and preview
 * Follows Single Responsibility Principle
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  FILE_CONSTRAINTS,
  ERROR_MESSAGES,
  isFileSizeValid,
  isImageTypeValid,
  isVideoTypeValid,
} from '@/lib/constants';
import { formatFileSize } from '@/lib/formatters';

// ============================================================================
// TYPES
// ============================================================================

export interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  sizeFormatted: string;
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  onFileAdded?: (file: FilePreview) => void;
  onFileRemoved?: (id: string) => void;
}

export interface UseFileUploadReturn {
  files: FilePreview[];
  isDragOver: boolean;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const {
    maxFiles = 10,
    maxFileSize = FILE_CONSTRAINTS.MAX_SIZE_BYTES,
    allowedTypes = [
      ...FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES,
      ...FILE_CONSTRAINTS.ALLOWED_VIDEO_TYPES,
    ],
    onFileAdded,
    onFileRemoved,
  } = options;

  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * Validates a single file
   */
  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (!isFileSizeValid(file.size, maxFileSize)) {
        toast.error(ERROR_MESSAGES.FILE_TOO_LARGE);
        return false;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(ERROR_MESSAGES.INVALID_FILE_TYPE);
        return false;
      }

      return true;
    },
    [maxFileSize, allowedTypes]
  );

  /**
   * Determines file type from MIME type
   */
  const getFileType = useCallback((file: File): FilePreview['type'] => {
    if (isImageTypeValid(file.type)) return 'image';
    if (isVideoTypeValid(file.type)) return 'video';
    return 'audio';
  }, []);

  /**
   * Creates a file preview object
   */
  const createFilePreview = useCallback(
    (file: File): FilePreview => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      const type = getFileType(file);
      const sizeFormatted = formatFileSize(file.size);

      return {
        id,
        file,
        url,
        type,
        size: file.size,
        sizeFormatted,
      };
    },
    [getFileType]
  );

  /**
   * Adds files to the upload queue
   */
  const addFiles = useCallback(
    (newFiles: File[]) => {
      // Check max files limit
      if (files.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: FilePreview[] = [];

      for (const file of newFiles) {
        // Check if we've reached the limit
        if (files.length + validFiles.length >= maxFiles) {
          toast.warning(`Only ${maxFiles} files allowed`);
          break;
        }

        // Validate file
        if (!validateFile(file)) {
          continue;
        }

        // Create preview
        const preview = createFilePreview(file);
        validFiles.push(preview);

        // Call callback
        onFileAdded?.(preview);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        toast.success(
          `${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added`
        );
      }
    },
    [files.length, maxFiles, validateFile, createFilePreview, onFileAdded]
  );

  /**
   * Removes a file from the upload queue
   */
  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const file = prev.find((f) => f.id === id);

        if (file) {
          // Revoke object URL to prevent memory leaks
          URL.revokeObjectURL(file.url);

          // Call callback
          onFileRemoved?.(id);
        }

        return prev.filter((f) => f.id !== id);
      });

      toast.success('File removed');
    },
    [onFileRemoved]
  );

  /**
   * Clears all files
   */
  const clearFiles = useCallback(() => {
    // Revoke all object URLs
    files.forEach((file) => {
      URL.revokeObjectURL(file.url);
    });

    setFiles([]);
  }, [files]);

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  /**
   * Handles drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  return {
    files,
    isDragOver,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

// ============================================================================
// HELPER COMPONENTS (Optional)
// ============================================================================

/**
 * Gets an icon component based on file type
 */
export function getFileIcon(type: FilePreview['type']): string {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
  };

  return icons[type];
}

/**
 * Checks if file is an image
 */
export function isImage(file: FilePreview): boolean {
  return file.type === 'image';
}

/**
 * Checks if file is a video
 */
export function isVideo(file: FilePreview): boolean {
  return file.type === 'video';
}
