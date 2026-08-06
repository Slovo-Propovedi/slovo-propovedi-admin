<script lang="ts">
  import { createMutation as makeMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    sectionControllerCreateMutation,
    playlistControllerFindAllOptions,
    sectionControllerUpdateMutation,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { CreateSectionDto, SectionEntity } from '$lib/api/generated';
  import { invalidateSection } from '$lib/api/invalidate';
  import { getErrorMessage } from '$lib/utils/errors';
  import { fieldText, trimmed } from '$lib/utils/strings';
  import {
    ITEMS_SIZE_LABELS,
    SLIDE_TITLE_LOCATION_LABELS,
    TRANSFORM_LABELS,
  } from '$lib/utils/labels';
  import { navigate } from '$lib/router/router.svelte';
  import Button from '$lib/components/Button.svelte';
  import CheckboxList from '$lib/components/CheckboxList.svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import Textarea from '$lib/components/Textarea.svelte';

  interface Props {
    mode: 'create' | 'edit';
    id?: string;
    initial?: SectionEntity;
  }

  let { mode, id = '', initial }: Props = $props();

  // The edit pages mount this form only after the record has loaded, so the
  // props stay stable for the form's lifetime. Reading them through closures
  // snapshots the values seen at mount time.
  function createFormSnapshot() {
    return {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      itemsSize: initial?.itemsSize ?? 'middle',
      itemsRows: initial?.itemsRows == null ? '' : String(initial.itemsRows),
      transform: initial?.transform ?? 'high',
      isDescriptionTitleOnSlideLarge: initial?.isDescriptionTitleOnSlideLarge ?? false,
      whereIsSlideTitleLocated: initial?.whereIsSlideTitleLocated ?? 'on',
      borderRadius: initial?.borderRadius ?? false,
      selectedPlaylistIds: initial?.playlists?.map((playlist) => playlist.id) ?? [],
    };
  }

  function isEditMode(): boolean {
    return mode === 'edit';
  }

  const formSnapshot = createFormSnapshot();
  const isEdit = isEditMode();

  let title = $state(formSnapshot.title);
  let description = $state(formSnapshot.description);
  let itemsSize = $state<string>(formSnapshot.itemsSize);
  let itemsRows = $state(formSnapshot.itemsRows);
  let transform = $state<string>(formSnapshot.transform);
  let isDescriptionTitleOnSlideLarge = $state(formSnapshot.isDescriptionTitleOnSlideLarge);
  let whereIsSlideTitleLocated = $state<string>(formSnapshot.whereIsSlideTitleLocated);
  let borderRadius = $state(formSnapshot.borderRadius);
  let selectedPlaylistIds = $state<string[]>(formSnapshot.selectedPlaylistIds);

  let submitError = $state('');

  const itemsSizeOptions = [
    { value: 'small', label: ITEMS_SIZE_LABELS.small },
    { value: 'middle', label: ITEMS_SIZE_LABELS.middle },
    { value: 'large', label: ITEMS_SIZE_LABELS.large },
    { value: 'xLarge', label: ITEMS_SIZE_LABELS.xLarge },
  ];

  const transformOptions = [
    { value: 'high', label: TRANSFORM_LABELS.high },
    { value: 'short', label: TRANSFORM_LABELS.short },
  ];

  const locationOptions = [
    { value: 'on', label: SLIDE_TITLE_LOCATION_LABELS.on },
    { value: 'under', label: SLIDE_TITLE_LOCATION_LABELS.under },
    { value: 'bothOnAndUnder', label: SLIDE_TITLE_LOCATION_LABELS.bothOnAndUnder },
  ];

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
    ...sectionControllerCreateMutation(),
    onSuccess: () => {
      invalidateSection(queryClient);
      navigate('/sections');
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const updateMutation = makeMutation(() => ({
    ...sectionControllerUpdateMutation(),
    onSuccess: () => {
      invalidateSection(queryClient, id);
      navigate(`/sections/${id}`);
    },
    onError: (error) => {
      submitError = getErrorMessage(error);
    },
  }));

  const isSubmitting = $derived(createMutation.isPending || updateMutation.isPending);

  function handleSubmit(): void {
    submitError = '';

    const rows = Number(itemsRows);
    const common: CreateSectionDto = {
      title: trimmed(title),
      description: trimmed(description) || undefined,
      itemsSize: itemsSize as CreateSectionDto['itemsSize'],
      itemsRows: fieldText(itemsRows) === '' || Number.isNaN(rows) ? undefined : rows,
      transform: transform as CreateSectionDto['transform'],
      isDescriptionTitleOnSlideLarge,
      whereIsSlideTitleLocated: whereIsSlideTitleLocated as CreateSectionDto['whereIsSlideTitleLocated'],
      borderRadius,
    };

    if (isEdit) {
      updateMutation.mutate({
        body: {
          ...common,
          // An empty array clears the section playlists on the backend.
          playlistsIds: selectedPlaylistIds,
        },
        path: { id },
      });
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
      <Input label="Название" bind:value={title} placeholder="Например: Последние проповеди" required />
      <Textarea label="Описание" bind:value={description} hint="Необязательно." />
    </div>
  </div>

  <div class="card" style:margin-top="20px">
    <div class="card-header">
      <h2>Оформление</h2>
    </div>
    <div class="card-body">
      <div class="form-grid">
        <Select label="Размер карточек" bind:value={itemsSize} options={itemsSizeOptions} />
        <Select label="Высота карточек" bind:value={transform} options={transformOptions} />
        <Select label="Расположение заголовка" bind:value={whereIsSlideTitleLocated} options={locationOptions} />
        <Input label="Строк" bind:value={itemsRows} type="number" min="1" hint="Необязательно." />
      </div>
      <label class="checkbox-option" style:margin-bottom="18px">
        <input type="checkbox" bind:checked={isDescriptionTitleOnSlideLarge} />
        <span class="checkbox-option-label">Крупный заголовок описания на слайде</span>
      </label>
      <label class="checkbox-option">
        <input type="checkbox" bind:checked={borderRadius} />
        <span class="checkbox-option-label">Скруглённые углы карточек</span>
      </label>
    </div>
  </div>

  {#if isEdit}
    <div class="card" style:margin-top="20px">
      <div class="card-header">
        <h2>Плейлисты раздела</h2>
      </div>
      <div class="card-body">
        <CheckboxList options={playlistOptions} selected={selectedPlaylistIds} onToggle={togglePlaylist} />
      </div>
    </div>
  {/if}

  <div class="form-actions">
    <Button type="button" variant="ghost" onclick={() => navigate(isEdit ? `/sections/${id}` : '/sections')}>
      Отмена
    </Button>
    <Button type="submit" loading={isSubmitting}>
      {isEdit ? 'Сохранить раздел' : 'Создать раздел'}
    </Button>
  </div>
</form>
