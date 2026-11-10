import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { WhatsAppGroup, WhatsAppGroupRow } from '../types/index.js';

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LINK_LENGTH = 200;
const MAX_MEMBERS_PER_REQUEST = 500;
const INVITE_LINK_PREFIX = 'https://chat.whatsapp.com/';
const IMAGE_BUCKET = 'albums';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Membre qui agit (issu de req.member). */
export interface Actor {
  id: string;
  is_admin: boolean;
}

export interface GroupInput {
  name?: unknown;
  description?: unknown;
  invite_link?: unknown;
  restricted?: unknown;
  pinned?: unknown;
}

function dbError(error: { message: string }, status = 500): AppError {
  return new AppError(status, error.message, 'DB_ERROR');
}

function validateName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new AppError(400, 'Le nom du groupe est requis', 'VALIDATION_ERROR');
  const name = value.trim();
  if (name.length > MAX_NAME_LENGTH) {
    throw new AppError(400, `Nom trop long (${MAX_NAME_LENGTH} caractères max)`, 'VALIDATION_ERROR');
  }
  return name;
}

function validateDescription(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new AppError(400, 'Description invalide', 'VALIDATION_ERROR');
  const description = value.trim() || null;
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new AppError(400, `Description trop longue (${MAX_DESCRIPTION_LENGTH} caractères max)`, 'VALIDATION_ERROR');
  }
  return description;
}

function validateInviteLink(value: unknown): string {
  const link = typeof value === 'string' ? value.trim() : '';
  if (
    !link.startsWith(INVITE_LINK_PREFIX) ||
    link.length === INVITE_LINK_PREFIX.length ||
    link.length > MAX_LINK_LENGTH ||
    /\s/.test(link)
  ) {
    throw new AppError(400, `Le lien d'invitation doit commencer par ${INVITE_LINK_PREFIX}`, 'VALIDATION_ERROR');
  }
  return link;
}

function validateMemberIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_MEMBERS_PER_REQUEST || value.some((id) => typeof id !== 'string' || !UUID_RE.test(id))) {
    throw new AppError(400, 'Liste de personnes invalide', 'VALIDATION_ERROR');
  }
  return Array.from(new Set(value as string[]));
}

async function fetchRow(groupId: string): Promise<WhatsAppGroupRow | null> {
  if (!UUID_RE.test(groupId)) return null;
  const { data, error } = await supabase.from('whatsapp_groups').select('*').eq('id', groupId).maybeSingle();
  if (error) throw dbError(error);
  return data as WhatsAppGroupRow | null;
}

/** Les admins ont acces a tous les groupes (y compris a acces limite). */
async function hasAccess(group: WhatsAppGroupRow, actor: Actor): Promise<boolean> {
  if (actor.is_admin || !group.restricted || group.created_by === actor.id) return true;
  const { data, error } = await supabase
    .from('whatsapp_group_access')
    .select('member_id')
    .eq('group_id', group.id)
    .eq('member_id', actor.id)
    .maybeSingle();
  if (error) throw dbError(error);
  return Boolean(data);
}

/** Groupe accessible au membre. Sans accès : 404 (le groupe est invisible, on ne révèle pas son existence). */
async function requireAccess(groupId: string, actor: Actor): Promise<WhatsAppGroupRow> {
  const group = await fetchRow(groupId);
  if (!group || !(await hasAccess(group, actor))) {
    throw new AppError(404, 'Groupe introuvable', 'NOT_FOUND');
  }
  return group;
}

async function assertMembersExist(memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) return;
  const { data, error } = await supabase.from('family_members').select('id').in('id', memberIds);
  if (error) throw dbError(error);
  if ((data ?? []).length !== memberIds.length) throw new AppError(400, 'Personne introuvable', 'VALIDATION_ERROR');
}

async function insertAccess(groupId: string, memberIds: string[], addedBy: string): Promise<void> {
  if (memberIds.length === 0) return;
  const { error } = await supabase.from('whatsapp_group_access').upsert(
    memberIds.map((member_id) => ({ group_id: groupId, member_id, added_by: addedBy })),
    { onConflict: 'group_id,member_id', ignoreDuplicates: true },
  );
  if (error) throw dbError(error, 400);
}

/** Ajoute les compteurs, l'accès et l'état du membre courant. Ne reçoit que des groupes accessibles. */
async function enrich(rows: WhatsAppGroupRow[], actor: Actor): Promise<WhatsAppGroup[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [access, joined, reports] = await Promise.all([
    supabase.from('whatsapp_group_access').select('group_id, member_id').in('group_id', ids),
    supabase.from('whatsapp_group_members').select('group_id, member_id').in('group_id', ids),
    supabase.from('whatsapp_group_link_reports').select('group_id, member_id').in('group_id', ids),
  ]);
  for (const r of [access, joined, reports]) if (r.error) throw dbError(r.error);

  return rows.map((row) => {
    const isCreator = row.created_by === actor.id;
    const groupReports = (reports.data ?? []).filter((r) => r.group_id === row.id);
    const groupJoined = (joined.data ?? []).filter((r) => r.group_id === row.id);
    return {
      ...row,
      joined_count: groupJoined.length,
      joined: groupJoined.some((r) => r.member_id === actor.id),
      is_creator: isCreator,
      access_member_ids: row.restricted
        ? (access.data ?? []).filter((r) => r.group_id === row.id).map((r) => r.member_id)
        : [],
      report_count: isCreator || actor.is_admin ? groupReports.length : 0,
      reported_by_me: groupReports.some((r) => r.member_id === actor.id),
    };
  });
}

async function getOne(groupId: string, actor: Actor): Promise<WhatsAppGroup> {
  const row = await requireAccess(groupId, actor);
  return (await enrich([row], actor))[0];
}

export const whatsappGroupService = {
  /** Groupes visibles par le membre : épinglés d'abord, puis par nom. */
  async list(actor: Actor): Promise<WhatsAppGroup[]> {
    const { data: groups, error } = await supabase
      .from('whatsapp_groups')
      .select('*')
      .order('pinned', { ascending: false })
      .order('name', { ascending: true });
    if (error) throw dbError(error);

    const { data: myAccess, error: accessError } = await supabase
      .from('whatsapp_group_access')
      .select('group_id')
      .eq('member_id', actor.id);
    if (accessError) throw dbError(accessError);
    const allowed = new Set((myAccess ?? []).map((a) => a.group_id));

    const visible = ((groups ?? []) as WhatsAppGroupRow[]).filter(
      (g) => actor.is_admin || !g.restricted || g.created_by === actor.id || allowed.has(g.id),
    );
    return enrich(visible, actor);
  },

  /** Crée un groupe (tout membre connecté). `memberIds` = personnes ajoutées à l'accès (accès limité). */
  async create(actor: Actor, input: GroupInput, memberIds: unknown): Promise<WhatsAppGroup> {
    const name = validateName(input.name);
    const description = input.description === undefined ? null : validateDescription(input.description);
    const inviteLink = validateInviteLink(input.invite_link);
    const restricted = input.restricted === true;
    const ids = validateMemberIds(memberIds);
    await assertMembersExist(ids);

    const { data, error } = await supabase
      .from('whatsapp_groups')
      .insert({
        name,
        description,
        invite_link: inviteLink,
        restricted,
        // L'épinglage est réservé au créateur et aux admins : le créateur l'est par définition.
        pinned: input.pinned === true,
        created_by: actor.id,
      })
      .select()
      .single();
    if (error || !data) throw new AppError(400, error?.message ?? 'Création impossible', 'DB_ERROR');

    if (restricted) await insertAccess(data.id, Array.from(new Set([actor.id, ...ids])), actor.id);
    return getOne(data.id, actor);
  },

  /**
   * Modifie la fiche (nom, description, lien, mode d'accès) : tout membre ayant accès, et les admins.
   * Seul l'épinglage est réservé au créateur ou à un admin.
   */
  async update(groupId: string, actor: Actor, input: GroupInput): Promise<WhatsAppGroup> {
    const group = await requireAccess(groupId, actor);
    const isCreator = group.created_by === actor.id;
    const patch: Partial<WhatsAppGroupRow> = {};

    if (input.name !== undefined) patch.name = validateName(input.name);
    if (input.description !== undefined) patch.description = validateDescription(input.description);

    let linkChanged = false;
    if (input.invite_link !== undefined) {
      patch.invite_link = validateInviteLink(input.invite_link);
      linkChanged = patch.invite_link !== group.invite_link;
    }

    if (input.restricted !== undefined) {
      if (typeof input.restricted !== 'boolean') throw new AppError(400, 'Accès invalide', 'VALIDATION_ERROR');
      if (input.restricted !== group.restricted) patch.restricted = input.restricted;
    }

    if (input.pinned !== undefined) {
      if (typeof input.pinned !== 'boolean') throw new AppError(400, 'Valeur invalide', 'VALIDATION_ERROR');
      if (input.pinned !== group.pinned) {
        if (!isCreator && !actor.is_admin) {
          throw new AppError(403, "Seul le créateur ou un admin peut épingler le groupe", 'FORBIDDEN');
        }
        patch.pinned = input.pinned;
      }
    }

    const fields = [input.name, input.description, input.invite_link, input.restricted, input.pinned];
    if (fields.every((v) => v === undefined)) throw new AppError(400, 'Rien à modifier', 'VALIDATION_ERROR');

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from('whatsapp_groups').update(patch).eq('id', groupId);
      if (error) throw new AppError(400, error.message, 'DB_ERROR');
    }

    // Nouveau lien : les signalements « lien cassé » ne sont plus d'actualité.
    if (linkChanged) {
      const { error } = await supabase.from('whatsapp_group_link_reports').delete().eq('group_id', groupId);
      if (error) throw dbError(error);
    }

    if (patch.restricted === true) {
      await insertAccess(groupId, [group.created_by ?? actor.id], actor.id);
    } else if (patch.restricted === false) {
      // Retour à « toute la famille » : la liste d'accès est vidée (un futur accès limité repart de zéro).
      const { error } = await supabase.from('whatsapp_group_access').delete().eq('group_id', groupId);
      if (error) throw dbError(error);
    }

    return getOne(groupId, actor);
  },

  /** Ajoute des personnes à l'accès — tout membre ayant accès. Idempotent. */
  async addAccess(groupId: string, actor: Actor, memberIds: unknown): Promise<WhatsAppGroup> {
    const group = await requireAccess(groupId, actor);
    if (!group.restricted) {
      throw new AppError(400, 'Ce groupe est ouvert à toute la famille', 'VALIDATION_ERROR');
    }
    const ids = validateMemberIds(memberIds);
    if (ids.length === 0) throw new AppError(400, 'Aucune personne à ajouter', 'VALIDATION_ERROR');
    await assertMembersExist(ids);
    await insertAccess(groupId, ids, actor.id);
    return getOne(groupId, actor);
  },

  /**
   * Retire une personne de l'accès — tout membre ayant accès (et les admins).
   * Garde-fou : le créateur garde toujours accès, donc le groupe ne se retrouve jamais sans personne ayant accès.
   */
  async removeAccess(groupId: string, actor: Actor, memberId: string): Promise<void> {
    const group = await requireAccess(groupId, actor);
    if (memberId === group.created_by) {
      throw new AppError(400, 'Le créateur garde toujours accès à son groupe', 'VALIDATION_ERROR');
    }
    if (group.created_by === null) {
      // Créateur supprimé : on empêche de retirer la dernière personne.
      const { count, error: countError } = await supabase
        .from('whatsapp_group_access')
        .select('member_id', { count: 'exact', head: true })
        .eq('group_id', groupId);
      if (countError) throw dbError(countError);
      if ((count ?? 0) <= 1) throw new AppError(400, 'Le groupe doit garder au moins une personne ayant accès', 'VALIDATION_ERROR');
    }
    const { error } = await supabase
      .from('whatsapp_group_access')
      .delete()
      .eq('group_id', groupId)
      .eq('member_id', memberId);
    if (error) throw dbError(error, 400);
  },

  /** « J'y suis déjà » : déclaration du membre courant. */
  async setJoined(groupId: string, actor: Actor, joined: boolean): Promise<WhatsAppGroup> {
    await requireAccess(groupId, actor);
    const query = joined
      ? supabase.from('whatsapp_group_members').upsert(
          { group_id: groupId, member_id: actor.id },
          { onConflict: 'group_id,member_id', ignoreDuplicates: true },
        )
      : supabase.from('whatsapp_group_members').delete().eq('group_id', groupId).eq('member_id', actor.id);
    const { error } = await query;
    if (error) throw dbError(error, 400);
    return getOne(groupId, actor);
  },

  /** « Le lien ne marche plus ? » : signalement au créateur (un par membre). */
  async reportLink(groupId: string, actor: Actor): Promise<WhatsAppGroup> {
    await requireAccess(groupId, actor);
    const { error } = await supabase.from('whatsapp_group_link_reports').upsert(
      { group_id: groupId, member_id: actor.id },
      { onConflict: 'group_id,member_id', ignoreDuplicates: true },
    );
    if (error) throw dbError(error, 400);
    return getOne(groupId, actor);
  },

  /** Remplace l'image du groupe — tout membre ayant accès. */
  async uploadImage(groupId: string, actor: Actor, file: Express.Multer.File): Promise<WhatsAppGroup> {
    const group = await requireAccess(groupId, actor);

    const ext = (file.originalname.split('.').pop() ?? 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
    const storagePath = `whatsapp-groups/${groupId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uploadError) throw new AppError(500, uploadError.message, 'STORAGE_ERROR');

    const { data: urlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);

    const { error } = await supabase.from('whatsapp_groups').update({ image_url: urlData.publicUrl }).eq('id', groupId);
    if (error) throw new AppError(400, error.message, 'DB_ERROR');

    await removeStoredImage(group.image_url);
    return getOne(groupId, actor);
  },

  /** Supprime le groupe — créateur ou admin. */
  async remove(groupId: string, actor: Actor): Promise<void> {
    const group = await fetchRow(groupId);
    if (!group) throw new AppError(404, 'Groupe introuvable', 'NOT_FOUND');
    if (group.created_by !== actor.id && !actor.is_admin) {
      if (!(await hasAccess(group, actor))) throw new AppError(404, 'Groupe introuvable', 'NOT_FOUND');
      throw new AppError(403, 'Seul le créateur du groupe peut le supprimer', 'FORBIDDEN');
    }
    const { error } = await supabase.from('whatsapp_groups').delete().eq('id', groupId);
    if (error) throw dbError(error, 400);
    await removeStoredImage(group.image_url);
  },
};

async function removeStoredImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl) return;
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index !== -1) {
    await supabase.storage.from(IMAGE_BUCKET).remove([imageUrl.slice(index + marker.length)]);
  }
}
