import { create } from 'zustand';
import { api } from '../services/api';
import type { Album, Photo } from '../types';

interface AlbumState {
  albums: Album[];
  currentAlbum: Album | null;
  photos: Photo[];
  loading: boolean;
  error: string | null;
  fetchAlbums: () => Promise<void>;
  fetchAlbum: (id: string) => Promise<void>;
  fetchPhotos: (albumId: string) => Promise<void>;
  createAlbum: (data: { title: string; description?: string; event_date?: string }) => Promise<Album>;
  uploadPhoto: (albumId: string, file: File, caption?: string) => Promise<Photo>;
}

export const useAlbumStore = create<AlbumState>((set, get) => ({
  albums: [],
  currentAlbum: null,
  photos: [],
  loading: false,
  error: null,

  fetchAlbums: async () => {
    set({ loading: true, error: null });
    try {
      const albums = await api.get<Album[]>('/albums');
      set({ albums, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAlbum: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const album = await api.get<Album>(`/albums/${id}`);
      set({ currentAlbum: album, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchPhotos: async (albumId: string) => {
    set({ loading: true, error: null });
    try {
      const photos = await api.get<Photo[]>(`/photos/album/${albumId}`);
      set({ photos, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createAlbum: async (data) => {
    const album = await api.post<Album>('/albums', data);
    set({ albums: [album, ...get().albums] });
    return album;
  },

  uploadPhoto: async (albumId, file, caption) => {
    const photo = await api.upload<Photo>(`/photos/album/${albumId}`, file, caption ? { caption } : undefined);
    if (get().currentAlbum?.id === albumId) {
      set({ photos: [photo, ...get().photos] });
    }
    return photo;
  },
}));
