<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { getFilesOptions } from '$lib/api/generated/@tanstack/svelte-query.gen';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Modal from '$lib/components/Modal.svelte';

  interface Props {
    open: boolean;
    onSelect: (fileUrl: string) => void;
  }

  let { open = $bindable(false), onSelect }: Props = $props();

  // Fetch only while the modal is visible, so the library loads fresh
  // (and re-fetches, being stale by default) each time it opens.
  const filesQuery = createQuery(() => ({
    ...getFilesOptions(),
    enabled: open,
  }));

  let files = $derived(filesQuery.data?.files ?? []);

  const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7];

  function close(): void {
    open = false;
  }

  function choose(fileUrl: string): void {
    onSelect(fileUrl);
    open = false;
  }
</script>

<Modal title="Выбор изображения" class="library-modal" open={open} onClose={close}>
  {#snippet children()}
    <div class="library-body">
      {#if filesQuery.isPending}
        <div class="library-grid library-grid-stagger">
          {#each SKELETON_ITEMS as index}
            <div class="library-skeleton" aria-hidden="true"></div>
          {/each}
        </div>
      {:else if filesQuery.isError}
        <div class="library-error">
          <Icon name="alert" size={30} />
          <div class="library-error-title">Не удалось загрузить изображения</div>
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => filesQuery.refetch()}>
            <Icon name="back" size={14} />
            Повторить
          </button>
        </div>
      {:else if files.length === 0}
        <EmptyState
          icon="▦"
          title="Изображений пока нет"
          hint="Загрузите обложку через форму — она появится в этой библиотеке."
        />
      {:else}
        <div class="library-grid library-grid-stagger">
          {#each files as file (file.fileUrl)}
            <button
              type="button"
              class="library-item"
              title={file.fileName}
              aria-label={`Выбрать ${file.fileName}`}
              onclick={() => choose(file.fileUrl)}
            >
              <img src={file.fileUrl} alt={file.fileName} loading="lazy" />
              <span class="library-check">
                <Icon name="check" size={14} />
              </span>
              <span class="library-item-name">{file.fileName}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</Modal>
