<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import { invalidateFiles } from '$lib/api/invalidate';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import ImageLibraryModal from '$lib/components/ImageLibraryModal.svelte';

  interface Props {
    value?: string;
    label?: string;
    hint?: string;
    isUploading?: boolean;
    onChange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    label = 'Обложка',
    hint,
    isUploading = $bindable(false),
    onChange,
  }: Props = $props();

  let libraryOpen = $state(false);

  const queryClient = useQueryClient();

  // FileUpload already syncs `value`; here we forward the change up and keep
  // the library fresh so a freshly uploaded cover is pickable right away.
  function handleUploadChange(url: string): void {
    onChange?.(url);
    if (url) invalidateFiles(queryClient);
  }

  function handleLibrarySelect(fileUrl: string): void {
    value = fileUrl;
    onChange?.(fileUrl);
  }
</script>

<FileUpload
  {label}
  {hint}
  kind="image"
  accept="image/*"
  bind:value
  bind:isUploading
  onChange={handleUploadChange}
/>

<div class="cover-picker-library">
  <button
    type="button"
    class="btn btn-ghost btn-sm"
    onclick={() => {
      libraryOpen = true;
    }}
  >
    <Icon name="images" size={15} />
    Выбрать из библиотеки
  </button>
</div>

<ImageLibraryModal bind:open={libraryOpen} onSelect={handleLibrarySelect} />
