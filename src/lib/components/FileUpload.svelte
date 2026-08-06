<script lang="ts">
  import { appControllerUploadFile } from '$lib/api/generated';
  import { getErrorMessage } from '$lib/utils/errors';
  import LoadingSpinner from './LoadingSpinner.svelte';

  interface Props {
    value?: string;
    label?: string;
    hint?: string;
    accept?: string;
    kind?: 'image' | 'audio' | 'any';
    onChange?: (url: string) => void;
  }

  let { value = $bindable(''), label = 'Файл', hint, accept, kind = 'any', onChange }: Props = $props();

  let isUploading = $state(false);
  let error = $state('');
  let input: HTMLInputElement;

  async function handleFile(event: Event): Promise<void> {
    // Never fire the request while another upload is in flight.
    if (isUploading) return;

    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;

    error = '';
    isUploading = true;
    try {
      const { data } = await appControllerUploadFile({ body: { file }, throwOnError: true });
      if (!data.fileUrl) throw new Error('Сервер не вернул URL файла');
      value = data.fileUrl;
      onChange?.(data.fileUrl);
    } catch (err) {
      error = getErrorMessage(err);
    } finally {
      isUploading = false;
    }
  }
</script>

<div class="field">
  {#if label}
    <span class="field-label">{label}</span>
  {/if}

  {#if value}
    <div class="upload-preview">
      {#if kind === 'image'}
        <img class="upload-preview-image" src={value} alt="" />
        <div class="upload-preview-meta">
          <div class="upload-preview-name">Изображение загружено</div>
          <div class="upload-preview-url">{value}</div>
        </div>
      {:else if kind === 'audio'}
        <div class="upload-preview-meta">
          <div class="upload-preview-name">Аудио загружено</div>
          <div class="upload-preview-url">{value}</div>
          <audio class="audio-player" controls src={value}></audio>
        </div>
      {:else}
        <div class="upload-preview-meta">
          <div class="upload-preview-name">Файл загружен</div>
          <div class="upload-preview-url">{value}</div>
        </div>
      {/if}
      <button
        type="button"
        class="btn btn-danger btn-sm"
        onclick={() => {
          value = '';
          onChange?.('');
        }}
      >
        Удалить
      </button>
    </div>
  {/if}

  <div
    class="upload-zone"
    class:is-uploading={isUploading}
    role="button"
    tabindex={isUploading ? -1 : 0}
    aria-disabled={isUploading}
    onclick={() => {
      if (isUploading) return;
      input?.click();
    }}
    onkeydown={(event) => {
      if (isUploading) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input?.click();
      }
    }}
  >
    {#if isUploading}
      <LoadingSpinner />
      <div class="upload-zone-title">Загрузка…</div>
    {:else}
      <div class="upload-zone-title">{value ? 'Заменить файл' : 'Выбрать файл'}</div>
      <div class="upload-zone-hint">{hint ?? 'Нажмите, чтобы выбрать файл'}</div>
    {/if}
  </div>

  <input
    type="file"
    bind:this={input}
    hidden
    {accept}
    disabled={isUploading}
    onchange={handleFile}
  />

  {#if error}
    <p class="field-error">{error}</p>
  {/if}
</div>
