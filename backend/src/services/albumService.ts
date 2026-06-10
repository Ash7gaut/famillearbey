import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Album } from '../types/index.js';

export const albumService = {
  async getAll(): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('event_date', { ascending: false, nullsFirst: false });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return data ?? [];
  },

  async getById(id: string): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Album introuvable', 'NOT_FOUND');
    return data;
  },

  async create(input: {
    title: string;
    description?: string;
    event_date?: string;
    created_by?: string;
  }): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .insert(input)
      .select()
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    return data;
  },

  async update(id: string, input: Partial<Album>): Promise<Album> {
    const { data, error } = await supabase
      .from('albums')
      .update({
        title: input.title,
        description: input.description,
        event_date: input.event_date,
        cover_url: input.cover_url,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Album introuvable', 'NOT_FOUND');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('albums').delete().eq('id', id);
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
  },
};
