<script lang="ts">
  import { createMutation as makeMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    sermonControllerCreateMutation,
    playlistControllerFindAllOptions,
    sermonControllerUpdateMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { SermonEntity } from '$lib/api/generated';
  import { invalidateSermon } from '$lib/api/invalidate';
  import { getErrorMessage } from '$lib/utils/errors';
  import { parseVerse } from '$lib/utils/labels';
  import { fieldText, trimmed } from '$lib/utils/strings';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import CheckboxList from '$lib/components/CheckboxList.svelte';
  import CoverPicker from '$lib/components/CoverPicker.svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import Input from '$lib/components/Input.svelte';
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
    return {
      title: initial?.title ?? '',
      artist: initial?.artist ?? '',
      artwork: initial?.artwork ?? '',
      book: initial?.book ?? '',
      chapter: initial?.chapter == null ? '' : String(initial.chapter),
      verseStart: initial?.verse == null
        ? ''
        : String(Array.isArray(initial.verse) ? initial.verse[0] : initial.verse),
      verseEnd: initial?.verse != null && Array.isArray(initial.verse)
        ? String(initial.verse[1])
        : '',
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
  let chapter = $state(formSnapshot.chapter);
  let verseStart = $state(formSnapshot.verseStart);
  let verseEnd = $state(formSnapshot.verseEnd);
  let description = $state(formSnapshot.description);
  let youtubeUrl = $state(formSnapshot.youtubeUrl);
  let audioUrl = $state(formSnapshot.audioUrl);
  let textFileUrl = $state(formSnapshot.textFileUrl);
  let selectedPlaylistIds = $state<string[]>(formSnapshot.selectedPlaylistIds);

  let submitError = $state('');

  let artworkUploading = $state(false);
  let audioUploading = $state(false);
  let textFileUploading = $state(false);

  const playlistsQuery = createQuery(() => playlistControllerFindAllOptions());
  let playlists = $derived(playlistsQuery.data?.playlists ?? []);

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

  function handleSubmit(): void {
    submitError = '';

    const chapterNumber = Number(chapter);
    const verse = parseVerse(verseStart, verseEnd);

    const body = {
      title: trimmed(title),
      description: trimmed(description),
      artist: trimmed(artist),
      artwork: trimmed(artwork),
      book: trimmed(book) || undefined,
      chapter: fieldText(chapter) === '' || Number.isNaN(chapterNumber) ? undefined : chapterNumber,
      verse: verse ?? undefined,
      youtubeUrl: trimmed(youtubeUrl) || undefined,
      audioUrl: trimmed(audioUrl) || undefined,
      textFileUrl: trimmed(textFileUrl) || undefined,
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
        <Input label="Исполнитель" bind:value={artist} placeholder="Кто читает проповедь" required />
        <Input label="Книга" bind:value={book} placeholder="Например: Иоанна" />
        <Input label="Глава" bind:value={chapter} type="number" min="1" />
      </div>
      <div class="form-grid">
        <Input label="Стих (с)" bind:value={verseStart} type="number" min="1" hint="Оставьте пустым, если стих не нужен." />
        <Input label="Стих (по)" bind:value={verseEnd} type="number" min="1" hint="Для диапазона, например 16–18." />
      </div>
      <Textarea label="Описание" bind:value={description} required />
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

  {#if isEdit}
    <div class="card" style:margin-top="20px">
      <div class="card-header">
        <h2>Плейлисты</h2>
      </div>
      <div class="card-body">
        <CheckboxList options={playlistOptions} selected={selectedPlaylistIds} onToggle={togglePlaylist} />
      </div>
    </div>
  {/if}

  <div class="form-actions">
    <Button type="button" variant="ghost" onclick={() => navigate(isEdit ? `/sermons/${id}` : '/sermons')}>
      Отмена
    </Button>
    <Button type="submit" loading={isSubmitting} disabled={someUploadInProgress}>
      {isEdit ? 'Сохранить проповедь' : 'Загрузить проповедь'}
    </Button>
  </div>
</form>
