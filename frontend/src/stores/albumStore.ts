import { create } from 'zustand';
import { api } from '../services/api';
import type { Album, AlbumVisibility, Photo } from '../types';

interface AlbumState {
  albums: Album[];
  currentAlbum: Album | null;
  photos: Photo[];
  loading: boolean;
  error: string | null;
  fetchAlbums: () => Promise<void>;
  fetchAlbum: (id: string) => Promise<void>;
  fetchPhotos: (albumId: string) => Promise<void>;
  createAlbum: (data: {
    title: string;
    description?: string;
    event_date?: string;
    visibility?: AlbumVisibility;
  }) => Promise<Album>;
  deleteAlbum: (id: string) => Promise<void>;
  uploadPhoto: (albumId: string, file: File, caption?: string) => Promise<Photo>;
  deletePhoto: (photoId: string) => Promise<void>;
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

  deleteAlbum: async (id) => {
    await api.delete(`/albums/${id}`);
    set({
      albums: get().albums.filter((album) => album.id !== id),
      currentAlbum: get().currentAlbum?.id === id ? null : get().currentAlbum,
      photos: get().currentAlbum?.id === id ? [] : get().photos,
    });
  },

  uploadPhoto: async (albumId, file, caption) => {
    const photo = await api.upload<Photo>(`/photos/album/${albumId}`, file, caption ? { caption } : undefined);
    if (get().currentAlbum?.id === albumId) {
      set({ photos: [photo, ...get().photos] });
      if (!get().currentAlbum?.cover_url) {
        set({
          currentAlbum: get().currentAlbum
            ? { ...get().currentAlbum!, cover_url: photo.url }
            : null,
        });
      }
    }
    set({
      albums: get().albums.map((album) =>
        album.id === albumId && !album.cover_url ? { ...album, cover_url: photo.url } : album,
      ),
    });
    return photo;
  },

  deletePhoto: async (photoId) => {
    const photo = get().photos.find((item) => item.id === photoId);
    await api.delete(`/photos/${photoId}`);

    const nextPhotos = get().photos.filter((item) => item.id !== photoId);
    const albumId = photo?.album_id ?? get().currentAlbum?.id;

    set({ photos: nextPhotos });

    if (albumId && get().currentAlbum?.cover_url === photo?.url) {
      const nextCover = nextPhotos[0]?.url ?? null;
      const currentAlbum = get().currentAlbum;
      set({
        currentAlbum:
          currentAlbum && currentAlbum.id === albumId
            ? { ...currentAlbum, cover_url: nextCover }
            : currentAlbum,
        albums: get().albums.map((album) =>
          album.id === albumId ? { ...album, cover_url: nextCover } : album,
        ),
      });
    }
  },
}));
