import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember } from '../types/index.js';

export const familyMemberService = {
  async getAll(): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('birth_date', { ascending: true });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return data ?? [];
  },

  async getById(id: string): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return data;
  },

  async create(input: Partial<FamilyMember>): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        first_name: input.first_name,
        last_name: input.last_name ?? 'Arbey',
        photo_url: input.photo_url,
        birth_date: input.birth_date,
        bio: input.bio,
        is_alive: input.is_alive ?? true,
      })
      .select()
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    return data;
  },

  async update(id: string, input: Partial<FamilyMember>): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        photo_url: input.photo_url,
        birth_date: input.birth_date,
        bio: input.bio,
        is_alive: input.is_alive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    return data;
  },
};
