// Display helpers and Russian labels shared across the admin panel.
import type { CreateSectionDto, SermonEntity } from '$lib/api/generated';
import { fieldText } from '$lib/utils/strings';

export type Verse = number | [number, number];

export const ITEMS_SIZE_LABELS: Record<NonNullable<CreateSectionDto['itemsSize']>, string> = {
  small: 'Маленький',
  middle: 'Средний',
  large: 'Большой',
  xLarge: 'Очень большой',
};

export const TRANSFORM_LABELS: Record<NonNullable<CreateSectionDto['transform']>, string> = {
  high: 'Высокий',
  middle: 'Средний',
  short: 'Низкий',
};

export const SLIDE_TITLE_LOCATION_LABELS: Record<
  NonNullable<CreateSectionDto['whereIsSlideTitleLocated']>,
  string
> = {
  on: 'На слайде',
  under: 'Под слайдом',
  bothOnAndUnder: 'И на, и под слайдом',
};

// Formats a single verse or a verse range into a readable string.
export function formatVerse(verse?: Verse | null): string {
  if (verse === undefined || verse === null) return '—';
  if (Array.isArray(verse)) return `${verse[0]}–${verse[1]}`;
  return String(verse);
}

// Parses the two verse inputs of a form into the wire type. Both fields are
// optional; the output follows this table:
// - only "from"    → single verse number (16)
// - "from" + "to"  → range tuple [16, 18]
// - neither        → undefined (no verse)
// - only "to"      → undefined: a lone end without a start is a user mistake,
//                    so it is ignored rather than inventing a start.
// A range collapses to a single number when the end is empty or equals the
// start. The inputs are Svelte-bound `<input type="number">` fields, so they
// arrive as numbers (or null when cleared); `fieldText` parses them at the
// boundary without crashing on non-string values.
export function parseVerse(start: unknown, end: unknown): Verse | undefined {
  const startText = fieldText(start);
  if (startText === '') return undefined;
  const startNumber = Number(startText);
  if (Number.isNaN(startNumber)) return undefined;
  const endText = fieldText(end);
  if (endText === '') return startNumber;
  const endNumber = Number(endText);
  if (Number.isNaN(endNumber) || endNumber === startNumber) return startNumber;
  return [startNumber, endNumber];
}

// Formats a scripture reference like "Иоанна 3 16" or "Иоанна 3 16–18".
export function formatReference(
  book?: string | null,
  chapter?: number | null,
  verse?: Verse | null,
): string {
  const parts: string[] = [];
  if (book) parts.push(book);
  if (chapter !== undefined && chapter !== null) parts.push(String(chapter));
  if (verse !== undefined && verse !== null) parts.push(formatVerse(verse));
  return parts.join(' ');
}

// Checks whether a URL points to an image (used to pick preview rendering).
export function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp)(\?.*)?$/i.test(url);
}

export type SermonLike = Pick<
  SermonEntity,
  'book' | 'chapter' | 'verse'
>;
