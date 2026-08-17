// Display helpers and Russian labels shared across the admin panel.
import type { CreateSectionDto, UserRole } from '$lib/api/generated';
import { fieldText } from '$lib/utils/strings';

// A single verse or a verse range. On the wire a two-integer array is always
// read as a range; a segments array holds disjoint verses and ranges.
export type VerseSegment = number | [number, number];
export type Verse = number | [number, number] | VerseSegment[];
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

// A verse array is a range tuple when it holds exactly two plain integers; a
// segments list holds tuples or mixes integers with tuples. The wire contract
// reads a two-integer array as a range, so this check mirrors it. Exported for
// the sermon form, which must apply the same reading to untrusted input.
export function isVerseRangeTuple(verse: unknown): verse is [number, number] {
  return (
    Array.isArray(verse) &&
    verse.length === 2 &&
    typeof verse[0] === 'number' &&
    typeof verse[1] === 'number'
  );
}

// Normalizes one verse segment to its display form: a collapsed [n, n] tuple
// reads as a single verse, a wider tuple as a range.
function formatVerseSegment(segment: VerseSegment): string {
  if (Array.isArray(segment)) {
    return segment[0] === segment[1] ? String(segment[0]) : `${segment[0]}–${segment[1]}`;
  }
  return String(segment);
}

// Formats a verse value (single, range or disjoint segments) into a readable
// string: 16, 16–18, 9–18, 20.
function formatVerseValue(verse: Verse): string {
  if (isVerseRangeTuple(verse)) return formatVerseSegment(verse);
  if (Array.isArray(verse)) return verse.map(formatVerseSegment).join(', ');
  return String(verse);
}

// Formats a single verse, a verse range or disjoint segments into a readable
// string. A missing value renders as an em dash.
export function formatVerse(verse?: Verse | null): string {
  if (verse === undefined || verse === null) return '—';
  return formatVerseValue(verse);
}

// Formats a single chapter or a chapter range into a readable string. Kept
// exported as part of the reference-notation toolkit (ADR-004).
export function formatChapter(chapter?: Chapter | null): string {
  if (chapter === undefined || chapter === null) return '—';
  if (Array.isArray(chapter)) return `${chapter[0]}–${chapter[1]}`;
  return String(chapter);
}

// Parses the two chapter range inputs of a form into the wire type. Both
// fields are optional; the output follows this table:
// - only "from"    → single number (3)
// - "from" + "to"  → range tuple [3, 4]
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

// Chapters keep the two-input range parser; verses moved to the free-text
// `parseVerseInput` (segments support).
export function parseChapter(start: unknown, end: unknown): Chapter | undefined {
  return parseRange(start, end);
}

// Parses one comma-separated part of the "Стихи" input: a single verse "16"
// or a range "16–18" (the dash may be '-', '–' or '—'). A collapsed range
// (a == b) is a single verse. Returns undefined for anything else.
function parseVerseSegment(part: string): VerseSegment | undefined {
  const match = /^(\d+)(?:\s*[-–—]\s*(\d+))?$/.exec(part);
  if (match === null) return undefined;
  const start = Number(match[1]);
  const end = match[2] === undefined ? undefined : Number(match[2]);
  // Verses are 1-based and must round-trip through String(): reject 0,
  // negatives and anything beyond Number.MAX_SAFE_INTEGER (2^53 − 1), which
  // String() would render as "1e+22" and could never parse back.
  if (!Number.isSafeInteger(start) || start < 1) return undefined;
  if (end !== undefined && (!Number.isSafeInteger(end) || end < 1)) return undefined;
  if (end === undefined || end === start) return start;
  return [start, end];
}

// Parses the free-text "Стихи" input into the wire type: a comma-separated
// list of single verses and ranges ("16", "16–18", "9–18, 20"). One part
// yields a number or a range tuple; several parts yield a segments array.
// Any invalid part (or an empty input) yields undefined — the form then
// sends null, clearing the field.
export function parseVerseInput(text: string): Verse | undefined {
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length === 0) return undefined;

  const segments: VerseSegment[] = [];
  for (const part of parts) {
    const segment = parseVerseSegment(part);
    if (segment === undefined) return undefined;
    segments.push(segment);
  }

  if (segments.length === 1) return segments[0];
  // Ambiguity guard: on the wire a two-element array of plain integers is
  // read as a range tuple, so "9, 20" must not be sent as [9, 20] — the
  // backend would silently read it as the range 9–20. Wrapping each single
  // verse as [n, n] keeps the disjoint meaning while staying unambiguous.
  if (segments.length === 2 && segments.every((segment) => typeof segment === 'number')) {
    return segments.map((segment) => [segment as number, segment as number]);
  }
  return segments;
}

// Serializes a verse value back into the free-text "Стихи" input. Mirrors
// formatVerse's normalization: [n, n] collapses to "n", segments join with
// ", ". A missing value renders as an empty string (the input is cleared).
export function serializeVerseInput(verse: Verse | null | undefined): string {
  if (verse === undefined || verse === null) return '';
  return formatVerseValue(verse);
}

// Formats a scripture reference like "Иоанна 3:16" or "Иоанна 3:16–18".
// The colon appears between chapter and verse only when both are present:
// without a verse the reference degrades to "Иоанна 3", without a chapter to
// "Иоанна 16", and with no parts at all to an empty string (never a dash).
// Disjoint segments extend the verse notation: "Иоанна 3:9–18, 20".
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
    if (hasVerse && isVerseRangeTuple(verse)) {
      // A chapter range with a verse range spans both: "3:16–4:2".
      reference = `${chapter[0]}:${verse[0]}–${chapter[1]}:${verse[1]}`;
    } else {
      // A chapter range never pairs with a single verse or a segments list
      // (the backend rejects both), so the display degrades to the chapter
      // range alone rather than inventing a misleading shape.
      reference = `${chapter[0]}–${chapter[1]}`;
    }
  } else if (hasChapter) {
    if (hasVerse && isVerseRangeTuple(verse)) {
      reference = `${chapter}:${formatVerseSegment(verse)}`;
    } else if (hasVerse) {
      reference = `${chapter}:${formatVerse(verse)}`;
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
