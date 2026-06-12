export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export interface CalendarCell {
  date: Date;
  day: number;
  inMonth: boolean;
  iso: string;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - startOffset);
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    cells.push({
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      iso: formatIsoDate(date),
    });
  }

  while (cells.length > 35 && cells.slice(-7).every((cell) => !cell.inMonth)) {
    cells.splice(-7);
  }

  return cells;
}

export function getMonthLabel(year: number, month: number): string {
  const label = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function isSameDay(isoA: string, isoB: string) {
  return isoA === isoB;
}

export function formatEventDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate);
  const startLabel = start.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (!endDate) return startLabel;

  const end = new Date(endDate);
  if (formatIsoDate(start) === formatIsoDate(end)) return startLabel;

  const endLabel = end.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `${startLabel} → ${endLabel}`;
}
