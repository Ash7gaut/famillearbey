import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cake,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  PartyPopper,
  Plus,
  Trash2,
} from 'lucide-react';
import { BackLink } from '../components/ui/BackLink';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuthReady } from '../hooks/useAuthReady';
import { api } from '../services/api';
import {
  WEEKDAY_LABELS,
  buildCalendarGrid,
  formatEventDateRange,
  getMonthLabel,
  isSameDay,
  shiftMonth,
} from '../lib/calendarUtils';
import { AlbumCreatorLine } from '../components/albums/AlbumCreatorLine';
import { memberFullName } from '../components/profile/memberUtils';
import type { CalendarMonth } from '../types/calendar';

function todayParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    iso: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  };
}

export function CalendarPage() {
  const { isAuthenticated } = useAuthReady();
  const today = todayParts();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [data, setData] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = useState(today.iso);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(today.iso);
  const [endDate, setEndDate] = useState('');

  const loadMonth = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const monthData = await api.get<CalendarMonth>(`/calendar/${year}/${month}`);
      setData(monthData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const birthdaysByDay = useMemo(() => {
    const map = new Map<number, CalendarMonth['birthdays']>();
    for (const birthday of data?.birthdays ?? []) {
      const list = map.get(birthday.day) ?? [];
      list.push(birthday);
      map.set(birthday.day, list);
    }
    return map;
  }, [data?.birthdays]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarMonth['events']>();
    for (const event of data?.events ?? []) {
      for (const day of event.days) {
        const list = map.get(day) ?? [];
        if (!list.some((item) => item.id === event.id)) {
          list.push(event);
        }
        map.set(day, list);
      }
    }
    return map;
  }, [data?.events]);

  const albumsByDay = useMemo(() => {
    const map = new Map<number, CalendarMonth['albums']>();
    for (const album of data?.albums ?? []) {
      const list = map.get(album.day) ?? [];
      list.push(album);
      map.set(album.day, list);
    }
    return map;
  }, [data?.albums]);

  const selectedDay = Number(selectedIso.split('-')[2]);
  const selectedBirthdays = birthdaysByDay.get(selectedDay) ?? [];
  const selectedEvents = eventsByDay.get(selectedDay) ?? [];
  const selectedAlbums = albumsByDay.get(selectedDay) ?? [];
  const hasSelectedItems =
    selectedBirthdays.length > 0 || selectedEvents.length > 0 || selectedAlbums.length > 0;

  function openEventFormForDay(iso: string) {
    setStartDate(iso);
    setEndDate('');
    setShowForm(true);
  }

  function goToMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    const day = Math.min(selectedDay, new Date(nextYear, nextMonth, 0).getDate());
    setSelectedIso(
      `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    );
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setFormError(null);
    try {
      await api.post('/events', {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_date: `${startDate}T00:00:00.000Z`,
        end_date: endDate ? `${endDate}T23:59:59.999Z` : null,
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setEndDate('');
      setShowForm(false);
      await loadMonth();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      await loadMonth();
    } catch {
      // erreur API
    }
  }

  return (
    <div className="space-y-6" data-testid="calendar-page">
      <BackLink to="/messagerie" label="Messages" data-testid="calendar-back-link" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title" data-testid="calendar-title">Calendrier familial</h1>
          <p className="page-subtitle">Anniversaires et événements de la famille, mois par mois.</p>
        </div>
        {!isAuthenticated && (
          <Link to="/login" className="btn-secondary shrink-0" data-testid="calendar-login-link">
            Se connecter pour ajouter
          </Link>
        )}
      </div>

      {showForm && (
        <form onSubmit={(e) => void handleCreateEvent(e)} className="card space-y-4" data-testid="event-form">
          <h2 className="font-display text-lg font-semibold text-ink-800">Créer un événement</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="event-title" className="mb-1 block text-sm font-medium text-ink-700">
                Titre
              </label>
              <input
                id="event-title"
                data-testid="event-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Repas de Noël, réunion famille…"
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="event-start" className="mb-1 block text-sm font-medium text-ink-700">
                Date de début
              </label>
              <input
                id="event-start"
                data-testid="event-start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="event-end" className="mb-1 block text-sm font-medium text-ink-700">
                Date de fin (optionnel)
              </label>
              <input
                id="event-end"
                data-testid="event-end-date-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="event-location" className="mb-1 block text-sm font-medium text-ink-700">
                Lieu
              </label>
              <input
                id="event-location"
                data-testid="event-location-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Chez mamie, Paris…"
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="event-description" className="mb-1 block text-sm font-medium text-ink-700">
                Description
              </label>
              <textarea
                id="event-description"
                data-testid="event-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600" data-testid="event-form-error">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn-primary" data-testid="event-submit-button">
              {creating ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" data-testid="event-cancel-button">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-cream-300/70 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              const next = shiftMonth(year, month, -1);
              goToMonth(next.year, next.month);
            }}
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-ink-700 transition hover:bg-cream-100"
            aria-label="Mois précédent"
            data-testid="calendar-prev-month-button"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl" data-testid="calendar-month-label">
              {getMonthLabel(year, month)}
            </h2>
            <button
              type="button"
              onClick={() => goToMonth(today.year, today.month)}
              data-testid="calendar-today-button"
              className="mt-1 text-xs font-medium text-warm-700 transition hover:text-warm-800"
            >
              Revenir à aujourd&apos;hui
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = shiftMonth(year, month, 1);
              goToMonth(next.year, next.month);
            }}
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-ink-700 transition hover:bg-cream-100"
            aria-label="Mois suivant"
            data-testid="calendar-next-month-button"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {error && <div className="p-4"><ErrorMessage message={error} onRetry={loadMonth} /></div>}

        {loading && !data ? (
          <div className="py-12">
            <LoadingSpinner data-testid="calendar-loading-spinner" />
          </div>
        ) : !error && data ? (
          <div data-testid="calendar-grid" className={`relative transition-opacity ${refreshing ? 'pointer-events-none opacity-60' : ''}`}>
            {refreshing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <LoadingSpinner data-testid="calendar-refreshing-spinner" />
              </div>
            )}
            <div className="grid grid-cols-7 border-b border-cream-300/70 bg-cream-100/60">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500 sm:text-xs"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((cell) => {
                const birthdays = cell.inMonth ? birthdaysByDay.get(cell.day) ?? [] : [];
                const events = cell.inMonth ? eventsByDay.get(cell.day) ?? [] : [];
                const albums = cell.inMonth ? albumsByDay.get(cell.day) ?? [] : [];
                const isSelected = isSameDay(cell.iso, selectedIso);
                const isToday = isSameDay(cell.iso, today.iso);
                const items = [
                  ...birthdays.map((birthday) => ({
                    key: `b-${birthday.member_id}`,
                    label: birthday.first_name,
                    tone: 'birthday' as const,
                  })),
                  ...events.map((event) => ({
                    key: `e-${event.id}`,
                    label: event.title,
                    tone: 'event' as const,
                  })),
                  ...albums.map((album) => ({
                    key: `a-${album.id}`,
                    label: album.title,
                    tone: 'album' as const,
                  })),
                ];

                return (
                  <div
                    key={cell.iso}
                    data-testid={`calendar-day-${cell.iso}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedIso(cell.iso)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIso(cell.iso);
                      }
                    }}
                    className={`group relative min-h-[88px] cursor-pointer border-b border-r border-cream-300/50 p-1.5 text-left transition sm:min-h-[104px] sm:p-2 ${
                      cell.inMonth ? 'bg-cream-50 hover:bg-cream-100/80' : 'bg-cream-100/40 text-ink-300'
                    } ${isSelected ? 'ring-2 ring-inset ring-warm-400' : ''}`}
                  >
                    {isAuthenticated && cell.inMonth && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIso(cell.iso);
                          openEventFormForDay(cell.iso);
                        }}
                        className="focus-ring absolute right-1 top-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-cream-200 bg-cream-50/95 text-warm-700 opacity-0 shadow-sm transition hover:bg-warm-50 hover:text-warm-800 group-hover:opacity-100 sm:right-1.5 sm:top-1.5"
                        title="Créer un événement ce jour"
                        data-testid={`calendar-day-add-button-${cell.iso}`}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    )}

                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
                        isToday
                          ? 'bg-warm-600 text-white'
                          : cell.inMonth
                            ? 'text-ink-700'
                            : 'text-ink-300'
                      }`}
                    >
                      {cell.day}
                    </span>

                    <div className="mt-1 space-y-0.5">
                      {items.slice(0, 2).map((item) => (
                        <p
                          key={item.key}
                          data-testid={`calendar-item-${cell.iso}-${item.key}`}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium sm:text-[11px] ${
                            item.tone === 'birthday'
                              ? 'bg-warm-100 text-warm-800'
                              : item.tone === 'album'
                                ? 'bg-cream-200 text-ink-700'
                                : 'bg-arbey-100 text-arbey-800'
                          }`}
                        >
                          {item.tone === 'birthday'
                            ? `🎂 ${item.label}`
                            : item.tone === 'album'
                              ? `📸 ${item.label}`
                              : item.label}
                        </p>
                      ))}
                      {items.length > 2 && (
                        <p className="px-1 text-[10px] font-medium text-ink-400">+{items.length - 2}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {data && !error && (
        <div className="card" data-testid="calendar-day-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink-800" data-testid="calendar-day-panel-title">
              {new Date(selectedIso).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => openEventFormForDay(selectedIso)}
                className="btn-secondary shrink-0"
                data-testid="calendar-day-new-event-button"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Événement ce jour
              </button>
            )}
          </div>

          {!hasSelectedItems ? (
            <p className="mt-3 text-sm text-ink-500" data-testid="calendar-day-empty">Rien de prévu ce jour-là.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedBirthdays.map((birthday) => (
                <Link
                  key={birthday.member_id}
                  to={`/profil/${birthday.member_id}`}
                  data-testid={`calendar-birthday-${birthday.member_id}`}
                  className="flex items-center gap-3 rounded-xl border border-warm-200 bg-warm-50/70 px-4 py-3 transition hover:bg-warm-50"
                >
                  <Cake className="h-5 w-5 text-warm-700" strokeWidth={2} />
                  <div>
                    <p className="font-medium text-ink-800">
                      Anniversaire de {memberFullName(birthday)}
                    </p>
                    <p className="text-sm text-ink-500">Voir le profil</p>
                  </div>
                </Link>
              ))}

              {selectedAlbums.map((album) => (
                <Link
                  key={album.id}
                  to={`/albums/${album.id}`}
                  data-testid={`calendar-album-${album.id}`}
                  className="flex items-center gap-3 rounded-xl border border-cream-300 bg-cream-100/80 px-4 py-3 transition hover:bg-cream-100"
                >
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-ink-400">
                      <Images className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-ink-800">Album · {album.title}</p>
                    <p className="text-sm text-ink-500">Voir les photos</p>
                  </div>
                </Link>
              ))}

              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  data-testid={`event-${event.id}`}
                  className="rounded-xl border border-arbey-200 bg-arbey-50/50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="h-5 w-5 shrink-0 text-arbey-700" strokeWidth={2} />
                        <p className="font-medium text-ink-800" data-testid={`event-title-${event.id}`}>{event.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-ink-500">
                        {formatEventDateRange(event.start_date, event.end_date)}
                      </p>
                      <AlbumCreatorLine creator={event.creator} className="mt-1" />
                      {event.location && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                          <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                          {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">{event.description}</p>
                      )}
                    </div>
                    {event.can_manage && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteEvent(event.id)}
                        data-testid={`event-delete-button-${event.id}`}
                        className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-red-600 transition hover:bg-red-50"
                        title="Supprimer l'événement"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-ink-500" data-testid="calendar-legend">
        <span className="rounded bg-warm-100 px-2 py-0.5 text-warm-800">🎂 Anniversaire</span>
        <span className="rounded bg-arbey-100 px-2 py-0.5 text-arbey-800">Événement</span>
        <span className="rounded bg-cream-200 px-2 py-0.5 text-ink-700">📸 Album photo</span>
      </div>
    </div>
  );
}
