import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { filterAlbumsForViewer } from './albumAccessService.js';
import { familyMemberService } from './familyMemberService.js';
import { eventService } from './eventService.js';
import type { CalendarAlbum, CalendarBirthday, CalendarMonth } from '../types/calendar.js';
import type { Album, FamilyMember } from '../types/index.js';

function parseBirthdayDayAndMonth(birthDate: string): { day: number; month: number } {
  const [, monthStr, dayStr] = birthDate.split('-');
  return {
    month: Number(monthStr),
    day: Number(dayStr),
  };
}

export const calendarService = {
  async getMonth(year: number, month: number, viewer?: FamilyMember): Promise<CalendarMonth> {
    if (month < 1 || month > 12) {
      throw new Error('Mois invalide');
    }

    const [members, events, albumRows] = await Promise.all([
      familyMemberService.getAll(),
      eventService.getForMonth(year, month),
      supabase
        .from('albums')
        .select('id, title, event_date, cover_url, visibility, created_by')
        .not('event_date', 'is', null)
        .then(({ data, error }) => {
          if (error) throw new AppError(500, error.message, 'DB_ERROR');
          return (data ?? []) as Album[];
        }),
    ]);

    const visibleAlbums = await filterAlbumsForViewer(albumRows, viewer?.id);
    const albums: CalendarAlbum[] = visibleAlbums
      .filter((album) => {
        if (!album.event_date) return false;
        const [, monthStr] = album.event_date.split('-');
        return Number(monthStr) === month;
      })
      .map((album) => ({
        id: album.id,
        title: album.title,
        day: Number(album.event_date!.split('-')[2]),
        cover_url: album.cover_url,
      }))
      .sort((a, b) => a.day - b.day || a.title.localeCompare(b.title, 'fr'));

    const birthdays: CalendarBirthday[] = members
      .filter((member) => member.is_alive && member.birth_date)
      .map((member) => {
        const { day, month: birthMonth } = parseBirthdayDayAndMonth(member.birth_date!);
        return {
          member,
          day,
          birthMonth,
        };
      })
      .filter((entry) => entry.birthMonth === month)
      .map(({ member, day }) => ({
        member_id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        day,
      }))
      .sort((a, b) => a.day - b.day || a.first_name.localeCompare(b.first_name, 'fr'));

    return {
      year,
      month,
      birthdays,
      events: events.map((event) => ({
        ...event,
        can_manage: !!viewer && (viewer.is_admin || event.created_by === viewer.id),
      })),
      albums,
    };
  },
};
