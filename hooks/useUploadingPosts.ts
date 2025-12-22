import { create } from 'zustand';
import { Post } from './usePosts';

export type UploadStage = 'uploading' | 'creating_post' | 'creating_token' | 'complete' | 'error';

export interface UploadingPost extends Omit<Post, 'id' | 'created_at'> {
  tempId: string;
  uploadProgress: number;
  uploadStage: UploadStage;
  error?: string;
  preview_url?: string; // For the image preview
}

interface UploadingPostsStore {
  uploadingPosts: UploadingPost[];
  addUploadingPost: (post: UploadingPost) => void;
  updateUploadingPost: (tempId: string, updates: Partial<UploadingPost>) => void;
  removeUploadingPost: (tempId: string) => void;
  clearCompletedPosts: () => void;
}

export const useUploadingPosts = create<UploadingPostsStore>((set) => ({
  uploadingPosts: [],

  addUploadingPost: (post) => {
    console.log('[UPLOADING POSTS] Adding new uploading post:', post.tempId);
    set((state) => ({
      uploadingPosts: [post, ...state.uploadingPosts],
    }));
  },

  updateUploadingPost: (tempId, updates) => {
    console.log('[UPLOADING POSTS] Updating post:', tempId, updates);
    set((state) => ({
      uploadingPosts: state.uploadingPosts.map((post) =>
        post.tempId === tempId ? { ...post, ...updates } : post
      ),
    }));
  },

  removeUploadingPost: (tempId) => {
    console.log('[UPLOADING POSTS] Removing post:', tempId);
    set((state) => ({
      uploadingPosts: state.uploadingPosts.filter((post) => post.tempId !== tempId),
    }));
  },

  clearCompletedPosts: () => {
    console.log('[UPLOADING POSTS] Clearing completed posts');
    set((state) => ({
      uploadingPosts: state.uploadingPosts.filter(
        (post) => post.uploadStage !== 'complete' && post.uploadStage !== 'error'
      ),
    }));
  },
}));
