<script lang="ts">
  import { createMutation as makeMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    createPlaylistMutation,
    getAllSermonsOptions,
    updatePlaylistMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { PlaylistEntity } from '$lib/api/generated';
  import { invalidatePlaylist } from '$lib/api/invalidate';
  import { getErrorMessage } from '$lib/utils/errors';
  import { formatReference } from '$lib/utils/labels';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import CheckboxList from '$lib/components/CheckboxList.svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import Input from '$lib/components/Input.svelte';
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

  let submitError = $state('');

  const sermonsQuery = createQuery(() => getAllSermonsOptions());
  let sermons = $derived(sermonsQuery.data?.sermons ?? []);

  let sermonOptions = $derived(
    sermons.map((sermon) => ({
      value: sermon.id,
      label: sermon.title,
      meta: sermon.artist || formatReference(sermon.book, sermon.chapter, sermon.verse),
    })),
  );

  function toggleSermon(value: string): void {
    selectedSermonIds = selectedSermonIds.includes(value)
      ? selectedSermonIds.filter((sermonId) => sermonId !== value)
      : [...selectedSermonIds, value];
  }

  const queryClient = useQueryClient();

  const createMutation = makeMutation(() => ({
    ...createPlaylistMutation(),
    onSuccess: () => {
      invalidatePlaylist(queryClient);
      navigate('/playlists');
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const updateMutation = makeMutation(() => ({
    ...updatePlaylistMutation(),
    onSuccess: () => {
      invalidatePlaylist(queryClient, id);
      navigate(`/playlists/${id}`);
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const isSubmitting = $derived(createMutation.isPending || updateMutation.isPending);

  function handleSubmit(): void {
    submitError = '';

    const common = {
      title: title.trim(),
      description: description.trim() || '',
      artwork: artwork.trim(),
      // Always send the array: an empty array clears the relations on the
      // backend, while undefined would be interpreted as "no change".
      sermonsIds: selectedSermonIds,
    };

    if (isEdit) {
      // sectionsIds is intentionally omitted: the form does not manage them.
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
      <FileUpload label="Обложка" kind="image" accept="image/*" bind:value={artwork} />
    </div>
  </div>

  <div class="card" style:margin-top="20px">
    <div class="card-header">
      <h2>Проповеди плейлиста</h2>
    </div>
    <div class="card-body">
      <CheckboxList options={sermonOptions} selected={selectedSermonIds} onToggle={toggleSermon} />
    </div>
  </div>

  <div class="form-actions">
    <Button type="button" variant="ghost" onclick={() => navigate(isEdit ? `/playlists/${id}` : '/playlists')}>
      Отмена
    </Button>
    <Button type="submit" loading={isSubmitting}>
      {isEdit ? 'Сохранить плейлист' : 'Создать плейлист'}
    </Button>
  </div>
</form>
