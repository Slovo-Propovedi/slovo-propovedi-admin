<script lang="ts">
  import { createMutation as makeMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    playlistControllerCreateMutation,
    playlistControllerUpdateMutation,
    sectionControllerFindAllOptions,
    sermonControllerFindAllOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { PlaylistEntity } from '$lib/api/generated';
  import { invalidatePlaylist } from '$lib/api/invalidate';
  import { debounce } from '$lib/utils/debounce';
  import { getErrorMessage } from '$lib/utils/errors';
  import { sermonSubtitle } from '$lib/utils/labels';
  import { trimmed } from '$lib/utils/strings';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import CheckboxList from '$lib/components/CheckboxList.svelte';
  import CoverPicker from '$lib/components/CoverPicker.svelte';
  import Input from '$lib/components/Input.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Textarea from '$lib/components/Textarea.svelte';

  interface Props {
    mode: 'create' | 'edit';
    id?: string;
    initial?: PlaylistEntity;
  }

  let { mode, id = '', initial }: Props = $props();

  // The edit pages mount this form only after the record has loaded, so the
  // props stay stable for the form's lifetime. Reading them through closures
  // snapshots the values seen at mount time.
  function createFormSnapshot() {
    return {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      artwork: initial?.artwork ?? '',
      selectedSermonIds: initial?.sermons?.map((sermon) => sermon.id) ?? [],
      selectedSectionIds: initial?.sections?.map((section) => section.id) ?? [],
    };
  }

  function isEditMode(): boolean {
    return mode === 'edit';
  }

  const formSnapshot = createFormSnapshot();
  const isEdit = isEditMode();

  let title = $state(formSnapshot.title);
  let description = $state(formSnapshot.description);
  let artwork = $state(formSnapshot.artwork);
  let selectedSermonIds = $state<string[]>(formSnapshot.selectedSermonIds);
  let selectedSectionIds = $state<string[]>(formSnapshot.selectedSectionIds);

  let submitError = $state('');

  let artworkUploading = $state(false);

  // The sermon picker is search-driven: typing filters the CheckboxList via the
  // debounced term, while `selectedSermonIds` stays the source of truth and
  // persists across searches — a chosen sermon remains selected even when the
  // current search filters it out of view. An empty term sends no `search`
  // param, so the initial load shows the full unfiltered list.
  let searchInput = $state('');
  let debouncedTerm = $state('');

  const applySearch = debounce((value: string) => {
    debouncedTerm = value;
  }, 300);

  const sermonsQuery = createQuery(() =>
    sermonControllerFindAllOptions({ query: { search: debouncedTerm || undefined } }),
  );
  let sermons = $derived(sermonsQuery.data?.sermons ?? []);

  // Each row carries the raw sermon in `data` so the item snippet can mirror
  // the full Sermons list row (cover, title, reference, media badges).
  let sermonOptions = $derived(
    sermons.map((sermon) => ({
      value: sermon.id,
      label: sermon.title,
      data: sermon,
    })),
  );

  function toggleSermon(value: string): void {
    selectedSermonIds = selectedSermonIds.includes(value)
      ? selectedSermonIds.filter((sermonId) => sermonId !== value)
      : [...selectedSermonIds, value];
  }

  // The section picker is a plain (non-search) list: sections are few and the
  // backend exposes no search param, so the whole catalog is loaded once.
  const sectionsQuery = createQuery(() => sectionControllerFindAllOptions());
  let sections = $derived(sectionsQuery.data?.sections ?? []);

  let sectionOptions = $derived(
    sections.map((section) => ({
      value: section.id,
      label: section.title,
    })),
  );

  function toggleSection(value: string): void {
    selectedSectionIds = selectedSectionIds.includes(value)
      ? selectedSectionIds.filter((sectionId) => sectionId !== value)
      : [...selectedSectionIds, value];
  }

  const queryClient = useQueryClient();

  const createMutation = makeMutation(() => ({
    ...playlistControllerCreateMutation(),
    onSuccess: () => {
      invalidatePlaylist(queryClient);
      navigate('/playlists');
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const updateMutation = makeMutation(() => ({
    ...playlistControllerUpdateMutation(),
    onSuccess: () => {
      invalidatePlaylist(queryClient, id);
      navigate(`/playlists/${id}`);
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const isSubmitting = $derived(createMutation.isPending || updateMutation.isPending);
  const someUploadInProgress = $derived(artworkUploading);

  function handleSubmit(): void {
    submitError = '';

    const common = {
      title: trimmed(title),
      // Nullable fields send `null` when cleared so the backend clears the
      // column; `undefined` (omitting the key) would be read as "no change".
      description: trimmed(description) || null,
      artwork: trimmed(artwork),
      // Always send the arrays: an empty array clears the relations on the
      // backend, while undefined would be interpreted as "no change".
      sermonsIds: selectedSermonIds,
      sectionsIds: selectedSectionIds,
    };

    if (isEdit) {
      updateMutation.mutate({ body: common, path: { id } });
    } else {
      createMutation.mutate({ body: common });
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
      <Input label="Название" bind:value={title} placeholder="Например: Поклонение" required />
      <Textarea label="Описание" bind:value={description} hint="Необязательно." />
      <CoverPicker label="Обложка" bind:value={artwork} bind:isUploading={artworkUploading} />
    </div>
  </div>

  <div class="card" style:margin-top="20px">
    <div class="card-header">
      <h2>Проповеди плейлиста</h2>
    </div>
    <div class="card-body">
      <Input
        label="Поиск"
        placeholder="Название, проповедник, книга…"
        bind:value={searchInput}
        oninput={() => applySearch(searchInput)}
        hint={selectedSermonIds.length > 0 ? `Выбрано: ${selectedSermonIds.length}` : undefined}
      />
      <CheckboxList options={sermonOptions} selected={selectedSermonIds} onToggle={toggleSermon}>
        {#snippet item(option)}
          {#if option.data}
            {@const sermon = option.data}
            {#if sermon.artwork}
              <img class="list-item-cover" src={sermon.artwork} alt="" />
            {:else}
              <div class="list-item-cover list-item-cover-placeholder">
                {sermon.title.slice(0, 1).toUpperCase()}
              </div>
            {/if}
            <div class="list-item-body">
              <div class="list-item-title">{sermon.title}</div>
              <div class="list-item-subtitle">{sermonSubtitle(sermon)}</div>
            </div>
            <div class="list-item-actions">
              {#if sermon.audioUrl}
                <span class="badge badge-gold">аудио</span>
              {/if}
              {#if sermon.youtubeUrl}
                <span class="badge badge-neutral">youtube</span>
              {/if}
              {#if sermon.textFileUrl}
                <span class="badge badge-neutral">текст</span>
              {/if}
            </div>
          {/if}
        {/snippet}
      </CheckboxList>
    </div>
  </div>

  <div class="card" style:margin-top="20px">
    <div class="card-header">
      <h2>Разделы</h2>
    </div>
    <div class="card-body">
      {#if sectionsQuery.isPending}
        <div class="loading-inline">
          <LoadingSpinner large />
        </div>
      {:else if sectionsQuery.isError && !sectionsQuery.data}
        <div class="form-error-banner">Не удалось загрузить разделы</div>
      {:else}
        <CheckboxList options={sectionOptions} selected={selectedSectionIds} onToggle={toggleSection} />
      {/if}
    </div>
  </div>

  <div class="form-actions">
    <Button type="button" variant="ghost" onclick={() => navigate(isEdit ? `/playlists/${id}` : '/playlists')}>
      Отмена
    </Button>
    <Button type="submit" loading={isSubmitting} disabled={someUploadInProgress}>
      {isEdit ? 'Сохранить плейлист' : 'Создать плейлист'}
    </Button>
  </div>
</form>
