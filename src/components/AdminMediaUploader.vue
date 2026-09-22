<script setup>
import Uppy from '@uppy/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PhArrowCounterClockwise, PhImage, PhTrash, PhUploadSimple } from '@phosphor-icons/vue'

const props = defineProps({
  id: { type: String, required: true },
  modelValue: { type: Object, default: null },
  label: { type: String, required: true },
  help: { type: String, default: '' },
  allowedFileTypes: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])
const input = ref(null)
const error = ref('')
const dragging = ref(false)
const previewUrl = ref('')

const uppy = new Uppy({
  id: props.id,
  autoProceed: false,
  restrictions: {
    maxNumberOfFiles: 1,
    allowedFileTypes: props.allowedFileTypes,
  },
})

const accept = computed(() => props.allowedFileTypes.join(','))
const formattedSize = computed(() => {
  const bytes = props.modelValue?.size || 0
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

function releasePreview() {
  if (!previewUrl.value) return
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function clearUppy() {
  uppy.getFiles().forEach((file) => uppy.removeFile(file.id))
}

function selectFile(fileList) {
  const file = fileList?.[0]
  if (!file) return

  const previousFile = uppy.getFiles()[0]
  error.value = ''
  clearUppy()

  try {
    uppy.addFile({
      name: file.name,
      type: file.type,
      data: file,
      source: 'Local',
      isRemote: false,
    })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'This image could not be added.'
    if (previousFile) {
      uppy.addFile({
        name: previousFile.name,
        type: previousFile.type,
        data: previousFile.data,
        source: previousFile.source,
        isRemote: previousFile.isRemote,
      })
    }
  }
}

function handleInput(event) {
  selectFile(event.target.files)
  event.target.value = ''
}

function handleDrop(event) {
  dragging.value = false
  selectFile(event.dataTransfer?.files)
}

function removeFile() {
  error.value = ''
  clearUppy()
}

function openPicker() {
  input.value?.click()
}

uppy.on('file-added', (file) => {
  releasePreview()
  previewUrl.value = URL.createObjectURL(file.data)
  emit('update:modelValue', file.data)
})

uppy.on('file-removed', () => {
  releasePreview()
  emit('update:modelValue', null)
})

uppy.on('restriction-failed', (_file, restrictionError) => {
  error.value = restrictionError.message
})

watch(() => props.modelValue, (value) => {
  if (!value && uppy.getFiles().length) clearUppy()
})

onBeforeUnmount(() => {
  releasePreview()
  uppy.destroy()
})
</script>

<template>
  <section class="admin-uploader" :class="{ 'has-file': modelValue, 'is-dragging': dragging }">
    <div class="admin-uploader-heading">
      <div>
        <strong>{{ label }}</strong>
        <span v-if="help">{{ help }}</span>
      </div>
      <PhImage :size="20" weight="duotone" />
    </div>

    <div v-if="modelValue" class="admin-uploader-preview">
      <img :src="previewUrl" :alt="`Preview of ${modelValue.name}`">
      <div class="admin-uploader-file">
        <strong>{{ modelValue.name }}</strong>
        <span>{{ formattedSize }}</span>
      </div>
      <div class="admin-uploader-actions">
        <button type="button" @click="openPicker">
          <PhArrowCounterClockwise :size="16" /> Replace
        </button>
        <button type="button" class="danger" @click="removeFile">
          <PhTrash :size="16" /> Remove
        </button>
      </div>
    </div>

    <label
      v-else
      class="admin-uploader-dropzone"
      :for="`${id}-input`"
      tabindex="0"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragenter.prevent="dragging=true"
      @dragover.prevent="dragging=true"
      @dragleave.prevent="dragging=false"
      @drop.prevent="handleDrop"
    >
      <span class="admin-uploader-icon"><PhUploadSimple :size="24" /></span>
      <strong>Drop an image here</strong>
      <span>or click to browse your device</span>
    </label>

    <input
      :id="`${id}-input`"
      ref="input"
      class="admin-uploader-input"
      type="file"
      :accept="accept"
      @change="handleInput"
    >
    <p v-if="error" class="admin-uploader-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.admin-uploader {
  display: grid;
  gap: .8rem;
}

.admin-uploader-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  color: #111;
}

.admin-uploader-heading > div {
  display: grid;
  gap: .3rem;
}

.admin-uploader-heading strong {
  font-size: .82rem;
  font-weight: 800;
}

.admin-uploader-heading span {
  color: #687078;
  font-size: .76rem;
  line-height: 1.45;
}

.admin-uploader-dropzone {
  min-height: 13.5rem;
  display: grid;
  place-items: center;
  align-content: center;
  gap: .55rem;
  padding: 1.5rem;
  border: 1px dashed #a8aaad;
  border-radius: .75rem;
  background: #f7f7f5;
  color: #111;
  text-align: center;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, transform .2s ease;
}

.admin-uploader-dropzone:hover,
.admin-uploader-dropzone:focus-visible,
.is-dragging .admin-uploader-dropzone {
  border-color: #111;
  background: #efefec;
  outline: 3px solid rgb(17 17 17 / .12);
  outline-offset: 2px;
}

.is-dragging .admin-uploader-dropzone { transform: translateY(-2px); }

.admin-uploader-dropzone > span:last-child {
  color: #6c7075;
  font-size: .78rem;
}

.admin-uploader-icon {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  border-radius: .65rem;
  background: #111;
  color: #fff;
}

.admin-uploader-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.admin-uploader-preview {
  overflow: hidden;
  border: 1px solid #dededb;
  border-radius: .75rem;
  background: #fff;
}

.admin-uploader-preview img {
  width: 100%;
  height: 10.5rem;
  object-fit: cover;
  background: #efefec;
}

.admin-uploader-file {
  display: grid;
  gap: .2rem;
  padding: .85rem 1rem;
  border-top: 1px solid #ececea;
}

.admin-uploader-file strong {
  overflow: hidden;
  color: #111;
  font-size: .8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-uploader-file span {
  color: #70757b;
  font-size: .72rem;
}

.admin-uploader-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #ececea;
}

.admin-uploader-actions button {
  min-height: 2.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  border: 0;
  background: #111;
  color: #fff;
  font: inherit;
  font-size: .75rem;
  font-weight: 800;
  cursor: pointer;
}

.admin-uploader-actions button + button { border-left: 1px solid #333; }
.admin-uploader-actions button:hover { background: #292929; }
.admin-uploader-actions button.danger { background: #fff; color: #a12c26; }
.admin-uploader-actions button.danger:hover { background: #fff2f0; }

.admin-uploader-actions button:focus-visible {
  outline: 3px solid rgb(17 17 17 / .18);
  outline-offset: -3px;
}

.admin-uploader-error {
  margin: 0;
  color: #a12c26;
  font-size: .76rem;
  font-weight: 700;
}
</style>
