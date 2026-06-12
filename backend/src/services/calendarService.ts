import { familyMemberService } from './familyMemberService.js';
import { eventService } from './eventService.js';
import type { CalendarBirthday, CalendarMonth } from '../types/calendar.js';
import type { FamilyMember } from '../types/index.js';

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

    const [members, events] = await Promise.all([
      familyMemberService.getAll(),
      eventService.getForMonth(year, month),
    ]);

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
    };
  },
};
