<script lang="ts">
  import { createMutation as makeMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    sermonControllerCreateMutation,
    playlistControllerFindAllOptions,
    sermonControllerGetDistinctValuesOptions,
    sermonControllerUpdateMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { SermonEntity } from '$lib/api/generated';
  import { invalidateSermon } from '$lib/api/invalidate';
  import { debounce } from '$lib/utils/debounce';
  import { getErrorMessage } from '$lib/utils/errors';
  import {
    isVerseRangeTuple,
    parseChapter,
    parseVerseInput,
    serializeVerseInput,
    type Verse,
  } from '$lib/utils/labels';
  import { fieldText, trimmed } from '$lib/utils/strings';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import CheckboxList from '$lib/components/CheckboxList.svelte';
  import Combobox from '$lib/components/Combobox.svelte';
  import CoverPicker from '$lib/components/CoverPicker.svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Textarea from '$lib/components/Textarea.svelte';

  interface Props {
    mode: 'create' | 'edit';
    id?: string;
    initial?: SermonEntity;
  }

  let { mode, id = '', initial }: Props = $props();

  // The edit pages mount this form only after the record has loaded, so the
  // props stay stable for the form's lifetime. Reading them through closures
  // snapshots the values seen at mount time.
  function createFormSnapshot() {
    const chapter = initial?.chapter;
    const chapterIsRange = chapter != null && Array.isArray(chapter);
    const verse = initial?.verse;
    const verseIsRangeTuple = isVerseRangeTuple(verse);

    return {
      title: initial?.title ?? '',
      artist: initial?.artist ?? '',
      artwork: initial?.artwork ?? '',
      book: initial?.book ?? '',
      chapterStart: chapter == null
        ? ''
        : String(Array.isArray(chapter) ? chapter[0] : chapter),
      chapterEnd: chapterIsRange ? String(chapter[1]) : '',
      // In range mode the verse pair is prefilled from a range tuple; single
      // verses and segments are illegal with a chapter range server-side, so
      // they leave the pair empty. In plain mode the text input holds the
      // serialized verse ('' for null/undefined).
      verseText: chapterIsRange ? '' : serializeVerseInput(verse),
      verseStart: chapterIsRange && verseIsRangeTuple ? String(verse[0]) : '',
      verseEnd: chapterIsRange && verseIsRangeTuple ? String(verse[1]) : '',
      description: initial?.description ?? '',
      youtubeUrl: initial?.youtubeUrl ?? '',
      audioUrl: initial?.audioUrl ?? '',
      textFileUrl: initial?.textFileUrl ?? '',
      selectedPlaylistIds: initial?.playlists?.map((playlist) => playlist.id) ?? [],
    };
  }

  function isEditMode(): boolean {
    return mode === 'edit';
  }

  const formSnapshot = createFormSnapshot();
  const isEdit = isEditMode();

  let title = $state(formSnapshot.title);
  let artist = $state(formSnapshot.artist);
  let artwork = $state(formSnapshot.artwork);
  let book = $state(formSnapshot.book);
  let chapterStart = $state(formSnapshot.chapterStart);
  let chapterEnd = $state(formSnapshot.chapterEnd);
  let verseText = $state(formSnapshot.verseText);
  let verseStart = $state(formSnapshot.verseStart);
  let verseEnd = $state(formSnapshot.verseEnd);
  // Tracks the previous chapter-end value so the input handler can tell a
  // mode switch (empty ↔ non-empty) apart from a plain value change.
  let lastChapterEnd = formSnapshot.chapterEnd;
  let description = $state(formSnapshot.description);
  let youtubeUrl = $state(formSnapshot.youtubeUrl);
  let audioUrl = $state(formSnapshot.audioUrl);
  let textFileUrl = $state(formSnapshot.textFileUrl);
  let selectedPlaylistIds = $state<string[]>(formSnapshot.selectedPlaylistIds);

  let submitError = $state('');

  let artworkUploading = $state(false);
  let audioUploading = $state(false);
  let textFileUploading = $state(false);

  // The playlist picker is search-driven: typing filters the CheckboxList via
  // the debounced term, while `selectedPlaylistIds` stays the source of truth
  // and persists across searches — a chosen playlist remains selected even
  // when the current search hides it from view. An empty term sends no
  // `search` param, so the initial load shows the full unfiltered list.
  let searchInput = $state('');
  let debouncedTerm = $state('');

  const applySearch = debounce((value: string) => {
    debouncedTerm = value;
  }, 300);

  const playlistsQuery = createQuery(() =>
    playlistControllerFindAllOptions({ query: { search: debouncedTerm || undefined } }),
  );
  let playlists = $derived(playlistsQuery.data?.playlists ?? []);

  // Suggestions for the artist/book comboboxes. Best-effort: on error or an
  // empty result the comboboxes just behave like plain inputs — the form
  // itself must never depend on this query, so it stays silent.
  const distinctValuesQuery = createQuery(() => ({
    ...sermonControllerGetDistinctValuesOptions(),
    staleTime: 5 * 60 * 1000,
  }));
  let artists = $derived(distinctValuesQuery.data?.artists ?? []);
  let books = $derived(distinctValuesQuery.data?.books ?? []);

  let playlistOptions = $derived(
    playlists.map((playlist) => ({
      value: playlist.id,
      label: playlist.title,
      meta: `${playlist.sermons?.length ?? 0} проповедей`,
    })),
  );

  function togglePlaylist(value: string): void {
    selectedPlaylistIds = selectedPlaylistIds.includes(value)
      ? selectedPlaylistIds.filter((playlistId) => playlistId !== value)
      : [...selectedPlaylistIds, value];
  }

  const queryClient = useQueryClient();

  const createMutation = makeMutation(() => ({
    ...sermonControllerCreateMutation(),
    onSuccess: () => {
      invalidateSermon(queryClient);
      navigate('/sermons');
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const updateMutation = makeMutation(() => ({
    ...sermonControllerUpdateMutation(),
    onSuccess: () => {
      invalidateSermon(queryClient, id);
      navigate(`/sermons/${id}`);
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const isSubmitting = $derived(createMutation.isPending || updateMutation.isPending);
  const someUploadInProgress = $derived(artworkUploading || audioUploading || textFileUploading);

  // A filled chapter-end switches the verse field into the range pair; an
  // empty one keeps the free-text input.
  const isRangeMode = $derived(fieldText(chapterEnd) !== '');

  // Live validation of the verse input. The error is derived state, so it
  // appears while typing, not only after a submit attempt.
  const verseError = $derived.by(() => {
    if (isRangeMode) {
      if (isOneVerseFieldFilled()) {
        return 'Заполните оба поля стихов или оставьте их пустыми.';
      }
      return '';
    }
    const text = verseText.trim();
    if (text !== '' && parseVerseInput(text) === undefined) {
      return 'Поле «Стихи» заполнено неверно. Примеры: 16, 16–18, 9–18, 20.';
    }
    return '';
  });

  function isOneVerseFieldFilled(): boolean {
    const startFilled = fieldText(verseStart) !== '';
    const endFilled = fieldText(verseEnd) !== '';
    return startFilled !== endFilled;
  }

  // Entering range mode: the free-text verse becomes a pair of number inputs.
  // A range tuple maps to both fields, a single verse to the start only, and
  // segments/invalid/empty text leaves both empty. The raw text stays in
  // `verseText` untouched so switching back restores exactly what was typed.
  function enterRangeMode(): void {
    const parsed = parseVerseInput(verseText);
    if (isVerseRangeTuple(parsed)) {
      verseStart = String(parsed[0]);
      verseEnd = String(parsed[1]);
    } else if (typeof parsed === 'number') {
      verseStart = String(parsed);
      verseEnd = '';
    } else {
      verseStart = '';
      verseEnd = '';
    }
  }

  // Leaving range mode: a completed pair becomes the plain-text range; an
  // empty pair restores the raw text preserved on entry (verseText was never
  // touched while in range mode). A half-filled pair is refused earlier in
  // handleChapterEndInput, so it never reaches this function.
  function leaveRangeMode(): void {
    const start = fieldText(verseStart);
    const end = fieldText(verseEnd);
    if (start !== '' && end !== '') {
      verseText = serializeVerseInput([Number(start), Number(end)]);
    }
  }

  // The chapter-end input is the mode switch: non-empty means range mode.
  // The Input's `bind:value` updates `chapterEnd` before this handler runs,
  // so `lastChapterEnd` (updated at the end) holds the previous value.
  function handleChapterEndInput(): void {
    const end = fieldText(chapterEnd);
    const wasRangeMode = lastChapterEnd !== '';
    if (end === '' && wasRangeMode) {
      // Leaving range mode with a half-filled verse pair is refused: plain
      // mode cannot represent it honestly (the text input would have to guess
      // which field the user meant), so the clear is blocked until the pair
      // is either completed or emptied.
      if (isOneVerseFieldFilled()) {
        chapterEnd = lastChapterEnd;
        return;
      }
      leaveRangeMode();
    } else if (end !== '' && !wasRangeMode) {
      enterRangeMode();
    }
    lastChapterEnd = end;
  }

  // Resolves the verse payload for submit. Returns null to clear the field,
  // the parsed value to send it, or undefined when the input is invalid — the
  // caller must not submit in that case (the inline error is already shown).
  function resolveVerse(): Verse | null | undefined {
    if (isRangeMode) {
      const start = fieldText(verseStart);
      const end = fieldText(verseEnd);
      if (start === '' && end === '') return null;
      if (start === '' || end === '') return undefined;
      return [Number(start), Number(end)];
    }
    const text = verseText.trim();
    if (text === '') return null;
    return parseVerseInput(text);
  }

  function handleSubmit(): void {
    submitError = '';

    const chapter = parseChapter(chapterStart, chapterEnd);
    const verse = resolveVerse();
    // An invalid verse input blocks the submit; the inline error is already
    // visible, so nothing is sent — in particular, unparseable text is never
    // coerced to null (which would silently wipe the saved verse).
    if (verse === undefined) return;

    const body = {
      title: trimmed(title),
      artist: trimmed(artist),
      artwork: trimmed(artwork),
      // Nullable fields send `null` when cleared so the backend clears the
      // column; `undefined` (omitting the key) would be read as "no change".
      description: trimmed(description) || null,
      book: trimmed(book) || null,
      chapter: chapter ?? null,
      verse: verse ?? null,
      youtubeUrl: trimmed(youtubeUrl) || null,
      audioUrl: trimmed(audioUrl) || null,
      textFileUrl: trimmed(textFileUrl) || null,
      // Always send the array: an empty array clears the relations on the
      // backend, while null would be interpreted as "no change".
      playlistsIds: selectedPlaylistIds,
    };

    if (isEdit) {
      updateMutation.mutate({ body, path: { id } });
    } else {
      createMutation.mutate({ body });
    }
  }
</script>

<form class="page-enter" onsubmit={(event) => {
  event.preventDefault();
  handleSubmit();
}}>
  {#if submitError}
    <div class="form-error-banner">{submitError}</div>
  {/if}

  <div class="card">
    <div class="card-header">
      <h2>Основное</h2>
    </div>
    <div class="card-body">
      <div class="form-grid">
        <Input label="Название" bind:value={title} placeholder="Например: Сила веры" required />
        <Combobox label="Исполнитель" bind:value={artist} options={artists} placeholder="Кто читает проповедь" required />
        <Combobox label="Книга" bind:value={book} options={books} placeholder="Например: Иоанна" />
      </div>
      <div class="form-grid">
        <Input label="Глава (с)" bind:value={chapterStart} type="number" min="1" hint="Оставьте пустым, если глава не нужна." />
        <Input
          label="Глава (по)"
          bind:value={chapterEnd}
          oninput={() => handleChapterEndInput()}
          type="number"
          min="1"
          hint="Для диапазона глав, например 10–11."
        />
      </div>
      {#if isRangeMode}
        <div class="form-grid">
          <Input label="Стих (с)" bind:value={verseStart} type="number" min="1" step="1" error={verseError} />
          <Input label="Стих (по)" bind:value={verseEnd} type="number" min="1" step="1" />
        </div>
        <p class="field-hint">С какого стиха начинается первая глава и каким заканчивается вторая. Например: 23–1.</p>
      {:else}
        <Input label="Стихи" bind:value={verseText} error={verseError} hint="Например: 16, 16–18 или 9–18, 20. Оставьте пустым, если стихи не нужны." />
      {/if}
      <Textarea label="Описание" bind:value={description} hint="Необязательно." />
    </div>
  </div>

  <div class="card" style:margin-top="20px">
    <div class="card-header">
      <h2>Медиа</h2>
    </div>
    <div class="card-body">
      <CoverPicker label="Обложка" bind:value={artwork} bind:isUploading={artworkUploading} />
      <FileUpload label="Аудио" kind="audio" accept=".mp3,audio/mpeg" bind:value={audioUrl} hint="Только MP3 формат." bind:isUploading={audioUploading} />
      <Input label="Ссылка на YouTube" bind:value={youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" />
      <FileUpload label="Текст проповеди" kind="any" bind:value={textFileUrl} hint="PDF или текстовый файл." bind:isUploading={textFileUploading} />
    </div>
  </div>

  <div class="card" style:margin-top="20px">
    <div class="card-header">
      <h2>Плейлисты</h2>
    </div>
    <div class="card-body">
      <Input
        label="Поиск"
        placeholder="Название, описание…"
        bind:value={searchInput}
        oninput={() => applySearch(searchInput)}
        hint={selectedPlaylistIds.length > 0 ? `Выбрано: ${selectedPlaylistIds.length}` : undefined}
      />
      {#if playlistsQuery.isPending}
        <div class="loading-inline">
          <LoadingSpinner large />
        </div>
      {:else if playlistsQuery.isError && !playlistsQuery.data}
        <div class="form-error-banner">Не удалось загрузить плейлисты</div>
      {:else if debouncedTerm !== '' && !playlistsQuery.isError && playlistOptions.length === 0}
        <p class="field-hint">Ничего не найдено</p>
      {:else}
        <CheckboxList options={playlistOptions} selected={selectedPlaylistIds} onToggle={togglePlaylist} />
      {/if}
    </div>
  </div>

  <div class="form-actions">
    <Button type="button" variant="ghost" onclick={() => navigate(isEdit ? `/sermons/${id}` : '/sermons')}>
      Отмена
    </Button>
    <Button type="submit" loading={isSubmitting} disabled={someUploadInProgress}>
      {isEdit ? 'Сохранить проповедь' : 'Загрузить проповедь'}
    </Button>
  </div>
</form>
