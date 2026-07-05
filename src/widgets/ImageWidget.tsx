import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Text, TextInput, Button, Stack, Image as MantineImage, Loader } from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { saveImage, getImage } from '../utils/imageStore'

interface Props {
  widget: Widget
}

export const ImageWidget = memo(function ImageWidget({ widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const src = widget.content.type === 'image' ? widget.content.src || '' : ''
  const alt = widget.content.type === 'image' ? widget.content.alt || '' : ''
  const [displaySrc, setDisplaySrc] = useState('')
  const [loadingImage, setLoadingImage] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setDisplaySrc('')
      return
    }
    if (src.startsWith('data:') || src.startsWith('http')) {
      setDisplaySrc(src)
      setError(false)
      return
    }
    setLoadingImage(true)
    setError(false)
    getImage(src)
      .then((data) => {
        setDisplaySrc(data ?? '')
        setLoadingImage(false)
      })
      .catch(() => {
        setDisplaySrc('')
        setLoadingImage(false)
        setError(true)
      })
  }, [src])

  const handleSaveUrl = useCallback(
    (imageSrc: string) => {
      updateWidget(widget.id, {
        content: { type: 'image', src: imageSrc, alt: alt || 'Image' },
      })
      setEditing(false)
      setError(false)
    },
    [widget.id, alt, updateWidget]
  )

  const handleFileUpload = useCallback(
    async (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const fileId = `img-${widget.id}-${Date.now()}`
        await saveImage(fileId, dataUrl)
        updateWidget(widget.id, {
          content: { type: 'image', src: fileId, alt: file.name },
        })
        setError(false)
      }
      reader.readAsDataURL(file)
    },
    [widget.id, updateWidget]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title="Image"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        rightSlot={
          <>
            <label
              htmlFor={`image-upload-${widget.id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--wb-text-dimmed)',
              }}
              aria-label="Upload image"
            >
              <IconUpload size={14} />
            </label>
            <input
              id={`image-upload-${widget.id}`}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
            />
          </>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
        {editing ? (
          <ImageUrlEditor src={src.startsWith('data:') ? '' : src} onSave={handleSaveUrl} />
        ) : loadingImage ? (
          <Loader size="sm" />
        ) : error ? (
          <Text size="sm" c="red.4" fs="italic" ta="center">
            Failed to load image
          </Text>
        ) : displaySrc ? (
          <MantineImage
            src={displaySrc}
            alt={alt}
            fit="contain"
            radius="var(--wb-radius)"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            Upload an image or paste a URL
          </Text>
        )}
      </div>
    </div>
  )
})

function ImageUrlEditor({
  src,
  onSave,
}: {
  src: string
  onSave: (url: string) => void
}) {
  const [url, setUrl] = useState(src)

  return (
    <Stack gap="xs" w="100%" p="xs">
      <TextInput
        value={url}
        onChange={(e) => setUrl(e.currentTarget.value)}
        placeholder="https://example.com/image.jpg"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) onSave(url) }}
      />
      <Button
        onClick={() => onSave(url)}
        variant="light"
        color="gray"
        fullWidth
        disabled={!url.trim()}
      >
        Load Image
      </Button>
    </Stack>
  )
}

export default ImageWidget
