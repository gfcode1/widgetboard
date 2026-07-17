import { memo, useState, useCallback, useRef } from 'react'
import { Text, Stack, Group, ActionIcon, TextInput, Loader, Tooltip } from '@mantine/core'
import {
  IconPhoto,
  IconUpload,
  IconArrowLeft,
  IconArrowRight,
  IconSearch,
  IconPlus,
} from '@tabler/icons-react'
import type { Widget } from '../types'
import { useStore } from '../store/useStore'
import { WidgetHeader } from './base/WidgetHeader'
import { saveImage } from '../utils/imageStore'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  widget: Widget
}

interface ImageItem {
  id: string
  src: string
  alt: string
}

const UNSPLASH_CATEGORIES = ['nature', 'city', 'abstract', 'technology', 'space', 'minimal']

export const ImageWidget = memo(function ImageWidget({ widget: _widget }: Props) {
  const updateWidget = useStore((s) => s.updateWidget)
  const widget = _widget
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [altInput, setAltInput] = useState('')
  const [images, setImages] = useState<ImageItem[]>(() => {
    const c = widget.content
    if (c.type === 'image' && c.src) return [{ id: '0', src: c.src, alt: c.alt || '' }]
    return []
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeImage = images[activeIndex]

  const addUrl = useCallback(() => {
    if (!urlInput.trim()) return
    setImages((prev) => [...prev, { id: uuidv4(), src: urlInput, alt: altInput }])
    updateWidget(widget.id, {
      content: { type: 'image' as const, src: urlInput, alt: altInput },
    })
    setUrlInput('')
    setAltInput('')
  }, [widget.id, urlInput, altInput, updateWidget])

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setLoading(true)
      setError('')
      try {
        const reader = new FileReader()
        reader.onload = async () => {
          const dataUrl = reader.result as string
          const id = `upload-${uuidv4()}`
          await saveImage(id, dataUrl)
          setImages((prev) => [...prev, { id, src: dataUrl, alt: file.name }])
          updateWidget(widget.id, {
            content: { type: 'image' as const, src: dataUrl, alt: file.name },
          })
          setLoading(false)
        }
        reader.onerror = () => {
          setError('Failed to read file')
          setLoading(false)
        }
        reader.readAsDataURL(file)
      } catch {
        setError('Failed to upload')
        setLoading(false)
      }
    },
    [widget.id, updateWidget]
  )

  const prevImage = () => setActiveIndex((i) => (i > 0 ? i - 1 : images.length - 1))
  const nextImage = () => setActiveIndex((i) => (i < images.length - 1 ? i + 1 : 0))

  const searchUnsplash = useCallback(async (query: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&count=1&client_id=demo`
      )
      if (res.ok) {
        const data = await res.json()
        if (data?.[0]?.urls?.regular) {
          const src = data[0].urls.regular
          const alt = data[0].alt_description || query
          setImages((prev) => [...prev, { id: uuidv4(), src, alt }])
        }
      } else {
        setError('Search failed')
      }
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!editing) return
      e.preventDefault()
      setZoom((z) => Math.max(0.5, Math.min(3, z - e.deltaY * 0.001)))
    },
    [editing]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WidgetHeader
        title={`Image${images.length > 1 ? ` (${activeIndex + 1}/${images.length})` : ''}`}
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        icon={<IconPhoto size={12} />}
        rightSlot={
          images.length > 1 ? (
            <Group gap={2}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={prevImage}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Previous image"
              >
                <IconArrowLeft size={12} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={nextImage}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Next image"
              >
                <IconArrowRight size={12} />
              </ActionIcon>
            </Group>
          ) : undefined
        }
      />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {editing ? (
          <Stack gap="xs" p={8}>
            <Group gap="xs">
              <TextInput
                value={urlInput}
                onChange={(e) => setUrlInput(e.currentTarget.value)}
                placeholder="Image URL..."
                size="xs"
                flex={1}
                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <ActionIcon
                variant="light"
                color="violet"
                size="sm"
                onClick={addUrl}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Add URL"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
            <TextInput
              value={altInput}
              onChange={(e) => setAltInput(e.currentTarget.value)}
              placeholder="Alt text..."
              size="xs"
              onMouseDown={(e) => e.stopPropagation()}
            />
            <Group gap="xs">
              <Text size="xs" fw={600} c="gray.3">
                Unsplash
              </Text>
            </Group>
            <Group gap={4}>
              {UNSPLASH_CATEGORIES.map((cat) => (
                <Tooltip key={cat} label={`Search ${cat}`}>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    size="sm"
                    onClick={() => searchUnsplash(cat)}
                    aria-label={`Search ${cat}`}
                  >
                    <IconSearch size={14} />
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
            <TextInput
              value={unsplashQuery}
              onChange={(e) => setUnsplashQuery(e.currentTarget.value)}
              placeholder="Search Unsplash..."
              size="xs"
              onKeyDown={(e) => e.key === 'Enter' && unsplashQuery && searchUnsplash(unsplashQuery)}
              onMouseDown={(e) => e.stopPropagation()}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => unsplashQuery && searchUnsplash(unsplashQuery)}
                  aria-label="Search"
                >
                  <IconSearch size={12} />
                </ActionIcon>
              }
            />
            <Group gap="xs">
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload image"
              >
                <IconUpload size={14} />
              </ActionIcon>
            </Group>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </Stack>
        ) : loading ? (
          <Stack align="center" justify="center" h="100%" gap="xs">
            <Loader size="sm" />
            {error && (
              <Text size="xs" c="red.4">
                {error}
              </Text>
            )}
          </Stack>
        ) : activeImage ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: editing ? 'auto' : 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onWheel={handleWheel}
          >
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              style={{
                width: `${100 * zoom}%`,
                height: `${100 * zoom}%`,
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 200ms ease',
              }}
              draggable={false}
            />
          </div>
        ) : (
          <Stack align="center" justify="center" h="100%" gap={8}>
            <IconPhoto size={24} style={{ opacity: 0.3 }} />
            <Text size="xs" c="dimmed" fs="italic" ta="center">
              Click Edit to add an image
            </Text>
          </Stack>
        )}
      </div>
    </div>
  )
})

export default ImageWidget
