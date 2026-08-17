// Display helpers and Russian labels shared across the admin panel.
import type { CreateSectionDto, SermonEntity, UserRole } from '$lib/api/generated';
import { fieldText } from '$lib/utils/strings';

export type Verse = number | [number, number];
export type Chapter = number | [number, number];

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

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  user: 'Пользователь',
};

// Formats a single verse or a verse range into a readable string.
export function formatVerse(verse?: Verse | null): string {
  if (verse === undefined || verse === null) return '—';
  if (Array.isArray(verse)) return `${verse[0]}–${verse[1]}`;
  return String(verse);
}

// Formats a single chapter or a chapter range into a readable string.
export function formatChapter(chapter?: Chapter | null): string {
  if (chapter === undefined || chapter === null) return '—';
  if (Array.isArray(chapter)) return `${chapter[0]}–${chapter[1]}`;
  return String(chapter);
}

// Parses the two range inputs of a form into the wire type. Both fields are
// optional; the output follows this table:
// - only "from"    → single number (16)
// - "from" + "to"  → range tuple [16, 18]
// - neither        → undefined (no value)
// - only "to"      → undefined: a lone end without a start is a user mistake,
//                    so it is ignored rather than inventing a start.
// A range collapses to a single number when the end is empty or equals the
// start. The inputs are Svelte-bound `<input type="number">` fields, so they
// arrive as numbers (or null when cleared); `fieldText` parses them at the
// boundary without crashing on non-string values.
function parseRange(start: unknown, end: unknown): number | [number, number] | undefined {
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

// Verse and chapter share the same wire shape (number or [start, end]), so
// both parse through the same range parser.
export function parseVerse(start: unknown, end: unknown): Verse | undefined {
  return parseRange(start, end);
}

export function parseChapter(start: unknown, end: unknown): Chapter | undefined {
  return parseRange(start, end);
}

// Formats a scripture reference like "Иоанна 3:16" or "Иоанна 3:16–18".
// The colon appears between chapter and verse only when both are present:
// without a verse the reference degrades to "Иоанна 3", without a chapter to
// "Иоанна 16", and with no parts at all to an empty string (never a dash).
// Chapter ranges extend the notation: "Иоанна 3:16–4:2" spans two chapters,
// and a chapter range alone degrades to "Иоанна 3–4".
export function formatReference(
  book?: string | null,
  chapter?: Chapter | null,
  verse?: Verse | null,
): string {
  const hasChapter = chapter !== undefined && chapter !== null;
  const hasVerse = verse !== undefined && verse !== null;

  let reference = '';
  if (hasChapter && Array.isArray(chapter)) {
    if (hasVerse && Array.isArray(verse)) {
      // A chapter range with a verse range spans both: "3:16–4:2".
      reference = `${chapter[0]}:${verse[0]}–${chapter[1]}:${verse[1]}`;
    } else {
      // A chapter range never pairs with a single verse (the backend rejects
      // it), so the display degrades to the chapter range alone rather than
      // inventing a misleading shape.
      reference = `${chapter[0]}–${chapter[1]}`;
    }
  } else if (hasChapter) {
    if (hasVerse && Array.isArray(verse)) {
      reference = `${chapter}:${verse[0]}–${verse[1]}`;
    } else if (hasVerse) {
      reference = `${chapter}:${verse}`;
    } else {
      reference = String(chapter);
    }
  } else if (hasVerse) {
    reference = formatVerse(verse);
  }

  return [book ?? '', reference].filter(Boolean).join(' ');
}

// The subtitle under a sermon's title: the preacher plus the scripture
// reference when one exists. A missing reference degrades to just the
// preacher, a missing preacher to just the reference, and neither to an
// empty string — never a dangling separator or the text "null". Accepts any
// object with these optional fields so both SermonEntity and PlaylistSermon
// can use it.
export function sermonSubtitle(sermon: {
  artist?: string | null;
  book?: string | null;
  chapter?: Chapter | null;
  verse?: Verse | null;
}): string {
  const reference = formatReference(sermon.book, sermon.chapter, sermon.verse);
  if (reference && sermon.artist) return `${sermon.artist} · ${reference}`;
  return reference || (sermon.artist ?? '');
}

// Checks whether a URL points to an image (used to pick preview rendering).
export function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp)(\?.*)?$/i.test(url);
}

export type SermonLike = Pick<
  SermonEntity,
  'book' | 'chapter' | 'verse'
>;
