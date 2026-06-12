import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateEventInput, CalendarEvent } from '../types/calendar.js';
import type { FamilyMember } from '../types/index.js';

function getEventDaysInMonth(
  startDate: string,
  endDate: string | null,
  year: number,
  month: number,
): number[] {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  const days = new Set<number>();

  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= last) {
    if (cursor.getFullYear() === year && cursor.getMonth() + 1 === month) {
      days.add(cursor.getDate());
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return [...days].sort((a, b) => a - b);
}

export const eventService = {
  async getForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lte('start_date', monthEnd.toISOString())
      .order('start_date', { ascending: true });

    if (error) throw new AppError(500, error.message, 'DB_ERROR');

    return (data ?? [])
      .filter((event) => {
        const start = new Date(event.start_date);
        const end = event.end_date ? new Date(event.end_date) : start;
        return start <= monthEnd && end >= monthStart;
      })
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        start_date: event.start_date,
        end_date: event.end_date,
        created_by: event.created_by,
        days: getEventDaysInMonth(event.start_date, event.end_date, year, month),
      }));
  },

  async create(input: CreateEventInput, member: FamilyMember) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        location: input.location?.trim() || null,
        start_date: input.start_date,
        end_date: input.end_date || null,
        created_by: member.id,
      })
      .select()
      .single();

    if (error) throw new AppError(400, error.message, 'DB_ERROR');
    return data;
  },

  async delete(id: string, member: FamilyMember): Promise<void> {
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !event) throw new AppError(404, 'Événement introuvable', 'NOT_FOUND');

    if (!member.is_admin && event.created_by !== member.id) {
      throw new AppError(403, 'Vous ne pouvez pas supprimer cet événement', 'FORBIDDEN');
    }

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new AppError(500, error.message, 'DB_ERROR');
  },
};
