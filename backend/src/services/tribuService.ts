import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Tribu } from '../types/index.js';

export const tribuService = {
  async getAll(): Promise<Tribu[]> {
    const { data, error } = await supabase
      .from('tribus')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return data ?? [];
  },

  async create(input: Partial<Tribu>): Promise<Tribu> {
    if (!input.name?.trim()) {
      throw new AppError(400, 'Le nom de la tribu est requis', 'VALIDATION_ERROR');
    }
    const { data, error } = await supabase
      .from('tribus')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        color: input.color?.trim() || null,
      })
      .select()
      .single();
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    return data;
  },

  async update(id: string, input: Partial<Tribu>): Promise<Tribu> {
    const { data, error } = await supabase
      .from('tribus')
      .update({
        name: input.name?.trim(),
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        color: input.color === undefined ? undefined : input.color?.trim() || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new AppError(404, 'Tribu introuvable', 'NOT_FOUND');
    return data;
  },

  async delete(id: string): Promise<void> {
    // Les membres sont détachés automatiquement (ON DELETE SET NULL).
    const { error } = await supabase.from('tribus').delete().eq('id', id);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  /** Assigne un membre à cette tribu (ou le détache si tribuId est null). */
  async setMemberTribu(memberId: string, tribuId: string | null): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .update({ tribu_id: tribuId })
      .eq('id', memberId);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
  },

  /** Détache un membre d'une tribu, seulement s'il y appartient réellement. */
  async removeMemberFromTribu(memberId: string, tribuId: string): Promise<void> {
    const { data, error } = await supabase
      .from('family_members')
      .select('tribu_id')
      .eq('id', memberId)
      .maybeSingle();
    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    if (!data) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');
    if (data.tribu_id === tribuId) {
      await this.setMemberTribu(memberId, null);
    }
  },
};
