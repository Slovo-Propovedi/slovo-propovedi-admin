<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    appControllerCleanupOrphanedFilesMutation,
    appControllerGetOrphanedFilesOptions,
    appControllerGetOrphanedFilesQueryKey,
    appControllerRemoveFileMutation,
    getFilesOptions,
  } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import type { FileMetadataDto } from '$lib/api/generated/types.gen';
  import { invalidateFiles } from '$lib/api/invalidate';
  import { uploadFileWithProgress } from '$lib/api/upload';
  import { getErrorMessage, getErrorStatus } from '$lib/utils/errors';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Toast from '$lib/components/Toast.svelte';

  type FileKind = 'image' | 'audio' | 'text';

  const KIND_LABELS: Record<FileKind, string> = {
    image: 'изображение',
    audio: 'аудио',
    text: 'текст',
  };

  // The orphans scan returns media extensions only, so anything without an
  // audio/text suffix is an image. Matching the catalog's allow-list keeps the
  // type badge and the "deletable" split honest.
  function fileKind(fileName: string): FileKind {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.mp3')) return 'audio';
    if (lower.endsWith('.pdf') || lower.endsWith('.fb2')) return 'text';
    return 'image';
  }

  function kindBadgeClass(kind: FileKind): string {
    return kind === 'audio' ? 'badge-gold' : 'badge-neutral';
  }

  // Binary size for the catalog/orphan rows; a missing size renders as an em
  // dash rather than a misleading "0 Б".
  function formatSize(size: number | null): string {
    if (size === null) return '—';
    if (size < 1024) return `${size} Б`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  }

  const queryClient = useQueryClient();
  let toastMessage = $state('');

  // ---- Catalog ---------------------------------------------------------

  const filesQuery = createQuery(() => getFilesOptions());
  let files = $derived(filesQuery.data?.files ?? []);

  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let uploadInput: HTMLInputElement;

  // Covers are uploaded straight from the catalog page — the natural place to
  // add an image — so the new file is immediately available for reuse.
  async function handleUpload(event: Event): Promise<void> {
    if (isUploading) return;
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;

    isUploading = true;
    uploadProgress = 0;
    try {
      await uploadFileWithProgress(file, (loaded, total) => {
        uploadProgress = total ? Math.round((loaded / total) * 100) : 0;
      });
      invalidateFiles(queryClient);
      toastMessage = 'Обложка загружена';
    } catch (error) {
      toastMessage = getErrorMessage(error);
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  let deleteTarget = $state<FileMetadataDto | null>(null);
  let isDeleteOpen = $derived(deleteTarget !== null);

  const removeMutation = createMutation(() => ({
    ...appControllerRemoveFileMutation(),
    onSuccess: () => {
      invalidateFiles(queryClient);
      toastMessage = 'Обложка удалена';
      deleteTarget = null;
    },
    onError: (error) => {
      // 409: the image is referenced as artwork — the backend refuses to let a
      // live cover disappear, so the user must detach it in the form first.
      toastMessage =
        getErrorStatus(error) === 409
          ? 'Обложка используется в проповедях/плейлистах'
          : getErrorMessage(error);
      deleteTarget = null;
    },
  }));

  function confirmDelete(): void {
    if (!deleteTarget) return;
    removeMutation.mutate({ path: { fileName: deleteTarget.fileName } });
  }

  // ---- Orphans ---------------------------------------------------------

  // The scan is opt-in: it walks the whole bucket, so it only runs after the
  // user asks for it. Re-clicking rescans without dropping the previous list.
  let showOrphans = $state(false);
  const orphansQuery = createQuery(() => ({
    ...appControllerGetOrphanedFilesOptions(),
    enabled: showOrphans,
  }));

  let orphans = $derived(orphansQuery.data?.orphaned ?? []);
  // Cleanup deletes audio/text only — images are never removed here, so the
  // count reflects what the endpoint will actually delete.
  let deletableOrphans = $derived(
    orphans.filter((file) => fileKind(file.fileName) !== 'image'),
  );

  let isCleanupOpen = $state(false);
  let cleanupResult = $state<{
    deleted: number;
    failed: { fileName: string; reason: string }[];
  } | null>(null);

  const cleanupMutation = createMutation(() => ({
    ...appControllerCleanupOrphanedFilesMutation(),
    onSuccess: (result) => {
      invalidateFiles(queryClient);
      queryClient.invalidateQueries({ queryKey: appControllerGetOrphanedFilesQueryKey() });
      cleanupResult = { deleted: result.deleted.length, failed: result.failed };
      isCleanupOpen = false;
      toastMessage = `Удалено файлов: ${result.deleted.length}`;
    },
    onError: (error) => {
      isCleanupOpen = false;
      toastMessage = getErrorMessage(error);
    },
  }));

  function findOrphans(): void {
    cleanupResult = null;
    if (showOrphans) {
      orphansQuery.refetch();
    } else {
      showOrphans = true;
    }
  }
</script>

<div class="page-enter">
  <div class="page-header">
    <div>
      <h1>Обложки</h1>
      <p class="page-subtitle">
        Библиотека изображений: загрузка, использование в проповедях и плейлистах, удаление.
      </p>
    </div>
    <div class="page-actions">
      <Button loading={isUploading} onclick={() => uploadInput?.click()}>
        <Icon name="upload" size={16} />
        {isUploading ? `Загрузка ${uploadProgress}%` : 'Загрузить обложку'}
      </Button>
    </div>
  </div>

  <input
    type="file"
    accept="image/*"
    hidden
    bind:this={uploadInput}
    disabled={isUploading}
    onchange={handleUpload}
  />

  {#if filesQuery.isPending}
    <div class="loading-inline">
      <LoadingSpinner large />
    </div>
  {:else if filesQuery.isError && !filesQuery.data}
    <div class="form-error-banner">{getErrorMessage(filesQuery.error)}</div>
  {:else if files.length === 0}
    <div class="card">
      <EmptyState
        icon="▦"
        title="Обложек пока нет"
        hint="Загрузите первую обложку — она появится в каталоге."
      >
        {#snippet action()}
          <Button onclick={() => uploadInput?.click()}>Загрузить обложку</Button>
        {/snippet}
      </EmptyState>
    </div>
  {:else}
    <div class="library-grid">
      {#each files as file (file.fileName)}
        <div class="cover-card">
          <div class="cover-card-thumb">
            <img src={file.fileUrl} alt={file.fileName} loading="lazy" />
            {#if file.used}
              <span class="badge badge-gold cover-card-badge">используется</span>
            {/if}
            <button
              type="button"
              class="cover-card-delete"
              title="Удалить обложку"
              aria-label={`Удалить ${file.fileName}`}
              onclick={() => (deleteTarget = file)}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
          <div class="cover-card-body">
            <div class="cover-card-name" title={file.fileName}>{file.fileName}</div>
            <div class="cover-card-meta">{formatSize(file.size)}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="detail-section">
    <h3>Осиротевшие файлы</h3>
    <p class="page-subtitle">
      Файлы в хранилище, не привязанные ни к одной проповеди или обложке. Очистка удаляет
      только аудио и тексты — изображения убирайте вручную из каталога выше.
    </p>
    <div class="page-actions" style:margin-top="16px">
      <Button variant="ghost" loading={orphansQuery.isFetching} onclick={findOrphans}>
        <Icon name="images" size={16} />
        Найти осиротевшие файлы
      </Button>
      {#if showOrphans && deletableOrphans.length > 0}
        <Button variant="danger" onclick={() => (isCleanupOpen = true)}>
          <Icon name="trash" size={16} />
          Удалить ({deletableOrphans.length})
        </Button>
      {/if}
    </div>

    {#if showOrphans}
      {#if orphansQuery.isFetching && !orphansQuery.data}
        <div class="loading-inline">
          <LoadingSpinner />
        </div>
      {:else if orphansQuery.isError && !orphansQuery.data}
        <div class="form-error-banner">{getErrorMessage(orphansQuery.error)}</div>
      {:else if orphans.length === 0}
        <div class="card">
          <EmptyState
            icon="✓"
            title="Осиротевших файлов нет"
            hint="В хранилище не осталось неиспользуемых файлов."
          />
        </div>
      {:else}
        <div class="orphan-list">
          {#each orphans as file (file.fileName)}
            {@const kind = fileKind(file.fileName)}
            <div class="orphan-row">
              <span class="badge {kindBadgeClass(kind)}">{KIND_LABELS[kind]}</span>
              <div class="orphan-info">
                <div class="orphan-name" title={file.fileName}>{file.fileName}</div>
                <div class="orphan-meta">{formatSize(file.size)}</div>
              </div>
              {#if kind === 'image'}
                <span class="orphan-note">удаляется вручную из каталога</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    {#if cleanupResult}
      <div class="form-success-banner">
        Удалено файлов: {cleanupResult.deleted}.
        {#if cleanupResult.failed.length > 0}
          Не удалось удалить: {cleanupResult.failed.length}.
        {/if}
      </div>
      {#if cleanupResult.failed.length > 0}
        <ul class="orphan-failed">
          {#each cleanupResult.failed as failure (failure.fileName)}
            <li><span class="orphan-name">{failure.fileName}</span> — {failure.reason}</li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>

{#if toastMessage}
  <Toast message={toastMessage} onDismiss={() => (toastMessage = '')} />
{/if}

<Modal title="Удалить обложку?" open={isDeleteOpen} onClose={() => (deleteTarget = null)}>
  <p>
    Файл «{deleteTarget?.fileName ?? ''}» будет удалён из хранилища без возможности
    восстановления.
  </p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (deleteTarget = null)}>Отмена</Button>
    <Button variant="danger" loading={removeMutation.isPending} onclick={confirmDelete}>
      Удалить
    </Button>
  {/snippet}
</Modal>

<Modal
  title="Удалить осиротевшие файлы?"
  open={isCleanupOpen}
  onClose={() => (isCleanupOpen = false)}
>
  <p>
    Будет удалено {deletableOrphans.length} осиротевших аудио- и текстовых файлов. Изображения
    не удаляются этой операцией — обложки убирайте вручную из каталога.
  </p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isCleanupOpen = false)}>Отмена</Button>
    <Button
      variant="danger"
      loading={cleanupMutation.isPending}
      onclick={() => cleanupMutation.mutate({})}
    >
      Удалить ({deletableOrphans.length})
    </Button>
  {/snippet}
</Modal>
