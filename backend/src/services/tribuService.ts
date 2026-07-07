import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FamilyMember } from '../types/index.js';
import type {
  CreateTribuInput,
  Tribu,
  TribuMemberSummary,
  TribuWithMembers,
  UpdateTribuInput,
} from '../types/tribu.js';

function canManageTribu(tribu: Tribu, member?: FamilyMember): boolean {
  if (!member) return false;
  return member.is_admin || tribu.chef_member_id === member.id;
}

function assertCanManage(tribu: Tribu, member: FamilyMember): void {
  if (!canManageTribu(tribu, member)) {
    throw new AppError(403, 'Vous ne pouvez pas gérer cette tribu', 'FORBIDDEN');
  }
}

async function enrichTribus(tribus: Tribu[], viewer?: FamilyMember): Promise<TribuWithMembers[]> {
  if (tribus.length === 0) return [];

  const { data: memberships, error } = await supabase
    .from('tribu_members')
    .select('tribu_id, member:family_members(id, first_name, last_name, photo_url)')
    .in(
      'tribu_id',
      tribus.map((t) => t.id),
    );

  if (error) throw new AppError(500, error.message, 'DB_ERROR');

  const membersByTribu = new Map<string, TribuMemberSummary[]>();
  for (const row of (memberships ?? []) as unknown as {
    tribu_id: string;
    member: { id: string; first_name: string; last_name: string; photo_url: string | null };
  }[]) {
    const tribu = tribus.find((t) => t.id === row.tribu_id);
    if (!tribu || !row.member) continue;

    const list = membersByTribu.get(row.tribu_id) ?? [];
    list.push({
      id: row.member.id,
      first_name: row.member.first_name,
      last_name: row.member.last_name,
      photo_url: row.member.photo_url,
      is_chef: row.member.id === tribu.chef_member_id,
    });
    membersByTribu.set(row.tribu_id, list);
  }

  return tribus.map((tribu) => ({
    ...tribu,
    members: (membersByTribu.get(tribu.id) ?? []).sort((a, b) =>
      a.is_chef === b.is_chef ? 0 : a.is_chef ? -1 : 1,
    ),
    can_manage: canManageTribu(tribu, viewer),
  }));
}

export const tribuService = {
  async getAll(): Promise<TribuWithMembers[]> {
    const { data, error } = await supabase.from('tribus').select('*').order('created_at', { ascending: true });
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    return enrichTribus(data ?? []);
  },

  async getById(id: string, viewer?: FamilyMember): Promise<TribuWithMembers> {
    const { data, error } = await supabase.from('tribus').select('*').eq('id', id).single();
    if (error || !data) throw new AppError(404, 'Tribu introuvable', 'NOT_FOUND');

    const [enriched] = await enrichTribus([data], viewer);
    return enriched;
  },

  async getMine(member: FamilyMember): Promise<TribuWithMembers | null> {
    const { data: membership, error } = await supabase
      .from('tribu_members')
      .select('tribu_id')
      .eq('member_id', member.id)
      .maybeSingle();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    if (!membership) return null;

    return this.getById(membership.tribu_id, member);
  },

  async create(input: CreateTribuInput, chef: FamilyMember): Promise<TribuWithMembers> {
    const { data: existing, error: existingError } = await supabase
      .from('tribu_members')
      .select('tribu_id')
      .eq('member_id', chef.id)
      .maybeSingle();

    if (existingError) throw new AppError(500, existingError.message, 'DB_ERROR');
    if (existing) throw new AppError(409, 'Vous appartenez déjà à une tribu', 'ALREADY_IN_TRIBU');

    const { data: tribu, error } = await supabase
      .from('tribus')
      .insert({ label: input.label?.trim() || null, chef_member_id: chef.id })
      .select('*')
      .single();

    if (error || !tribu) throw new AppError(400, error?.message ?? 'Création impossible', 'DB_ERROR');

    const { error: memberError } = await supabase
      .from('tribu_members')
      .insert({ tribu_id: tribu.id, member_id: chef.id });

    if (memberError) {
      await supabase.from('tribus').delete().eq('id', tribu.id);
      throw new AppError(400, memberError.message, 'DB_ERROR');
    }

    return this.getById(tribu.id, chef);
  },

  async update(id: string, input: UpdateTribuInput, actor: FamilyMember): Promise<TribuWithMembers> {
    const tribu = await this.getById(id, actor);
    assertCanManage(tribu, actor);

    const { data, error } = await supabase
      .from('tribus')
      .update({ label: input.label?.trim() || null })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new AppError(404, 'Tribu introuvable', 'NOT_FOUND');

    const [enriched] = await enrichTribus([data], actor);
    return enriched;
  },

  async delete(id: string, actor: FamilyMember): Promise<void> {
    const tribu = await this.getById(id, actor);
    assertCanManage(tribu, actor);

    const { error } = await supabase.from('tribus').delete().eq('id', id);
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
  },

  async addMember(tribuId: string, memberId: string, actor: FamilyMember): Promise<TribuWithMembers> {
    const tribu = await this.getById(tribuId, actor);
    assertCanManage(tribu, actor);

    const { data: candidate, error: candidateError } = await supabase
      .from('family_members')
      .select('id')
      .eq('id', memberId)
      .maybeSingle();

    if (candidateError) throw new AppError(500, candidateError.message, 'DB_ERROR');
    if (!candidate) throw new AppError(404, 'Membre introuvable', 'NOT_FOUND');

    const { data: existingMembership, error: existingError } = await supabase
      .from('tribu_members')
      .select('tribu_id')
      .eq('member_id', memberId)
      .maybeSingle();

    if (existingError) throw new AppError(500, existingError.message, 'DB_ERROR');

    if (existingMembership) {
      if (existingMembership.tribu_id === tribuId) {
        return this.getById(tribuId, actor);
      }

      const { data: otherTribu, error: otherError } = await supabase
        .from('tribus')
        .select('chef_member_id')
        .eq('id', existingMembership.tribu_id)
        .single();

      if (otherError) throw new AppError(500, otherError.message, 'DB_ERROR');
      if (otherTribu?.chef_member_id === memberId) {
        throw new AppError(
          409,
          'Le chef ne peut pas quitter sa propre tribu ainsi ; supprimez la tribu ou changez son chef',
          'CHEF_CANNOT_MOVE',
        );
      }

      const { error: deleteError } = await supabase
        .from('tribu_members')
        .delete()
        .eq('member_id', memberId);

      if (deleteError) throw new AppError(500, deleteError.message, 'DB_ERROR');
    }

    const { error: insertError } = await supabase
      .from('tribu_members')
      .insert({ tribu_id: tribuId, member_id: memberId });

    if (insertError) throw new AppError(400, insertError.message, 'DB_ERROR');

    return this.getById(tribuId, actor);
  },

  async removeMember(tribuId: string, memberId: string, actor: FamilyMember): Promise<TribuWithMembers> {
    const tribu = await this.getById(tribuId, actor);
    assertCanManage(tribu, actor);

    if (memberId === tribu.chef_member_id) {
      throw new AppError(
        409,
        'Le chef ne peut pas être retiré de sa tribu — supprimez la tribu à la place',
        'CANNOT_REMOVE_CHEF',
      );
    }

    const { data, error } = await supabase
      .from('tribu_members')
      .delete()
      .eq('tribu_id', tribuId)
      .eq('member_id', memberId)
      .select('id')
      .maybeSingle();

    if (error) throw new AppError(500, error.message, 'DB_ERROR');
    if (!data) throw new AppError(404, "Ce membre n'appartient pas à cette tribu", 'NOT_FOUND');

    return this.getById(tribuId, actor);
  },
};
