import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'md',
  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  colors: {
    violet: [
      '#f3f0ff',
      '#e5d9ff',
      '#d0bfff',
      '#b49aff',
      '#9775fa',
      '#8b5cf6',
      '#7c3aed',
      '#6d28d9',
      '#5b21b6',
      '#4c1d95',
    ],
    dark: [
      '#d0d1d5',
      '#acadaf',
      '#87888d',
      '#63646b',
      '#4a4857',
      '#363445',
      '#2a2835',
      '#1f1d2a',
      '#16141f',
      '#0f0d17',
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        p: 'sm',
      },
      styles: {
        root: {
          backgroundColor: 'var(--wb-surface)',
          border: '1px solid var(--wb-border)',
          borderRadius: 'var(--wb-radius)',
        },
      },
    },
    Button: {
      defaultProps: {
        size: 'compact-md',
      },
      styles: {
        root: {
          borderRadius: 'var(--wb-radius)',
          fontWeight: 500,
          transition: 'all var(--wb-transition-fast)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        variant: 'subtle',
      },
      styles: {
        root: {
          borderRadius: 'var(--wb-radius-sm)',
          transition: 'all var(--wb-transition-fast)',
          '&:hover': {
            backgroundColor: 'var(--wb-accent-subtle)',
          },
        },
      },
    },
    TextInput: {
      defaultProps: {
        size: 'sm',
      },
      styles: {
        input: {
          backgroundColor: 'var(--wb-surface-hover)',
          borderColor: 'var(--wb-border)',
          color: 'var(--wb-text)',
          borderRadius: 'var(--wb-radius-sm)',
          '&:focus': {
            borderColor: 'var(--wb-accent)',
            boxShadow: '0 0 0 1px var(--wb-accent)',
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        size: 'sm',
      },
      styles: {
        input: {
          backgroundColor: 'var(--wb-surface-hover)',
          borderColor: 'var(--wb-border)',
          color: 'var(--wb-text)',
          borderRadius: 'var(--wb-radius-sm)',
          '&:focus': {
            borderColor: 'var(--wb-accent)',
            boxShadow: '0 0 0 1px var(--wb-accent)',
          },
        },
      },
    },
    Tooltip: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        tooltip: {
          backgroundColor: 'var(--wb-surface-solid)',
          border: '1px solid var(--wb-border-solid)',
          boxShadow: 'var(--wb-shadow-md)',
          fontSize: 12,
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'md',
      },
    },
    Drawer: {
      defaultProps: {
        radius: 'md',
      },
    },
    Checkbox: {
      styles: {
        input: {
          '&:checked': {
            backgroundColor: 'var(--wb-accent)',
            borderColor: 'var(--wb-accent)',
          },
        },
      },
    },
    Chip: {
      styles: {
        input: {
          '&[data-checked]': {
            backgroundColor: 'var(--wb-accent-subtle)',
            borderColor: 'var(--wb-border-accent)',
            color: 'var(--wb-accent)',
          },
        },
      },
    },
    Select: {
      styles: {
        input: {
          backgroundColor: 'var(--wb-surface-hover)',
          borderColor: 'var(--wb-border)',
          color: 'var(--wb-text)',
          '&:focus': {
            borderColor: 'var(--wb-accent)',
          },
        },
        dropdown: {
          backgroundColor: 'var(--wb-surface-solid)',
          border: '1px solid var(--wb-border-solid)',
          boxShadow: 'var(--wb-shadow-lg)',
        },
        option: {
          '&[data-selected]': {
            backgroundColor: 'var(--wb-accent-subtle)',
          },
          '&[data-hovered]': {
            backgroundColor: 'var(--wb-surface-hover)',
          },
        },
      },
    },
    Skeleton: {
      styles: {
        root: {
          backgroundColor: 'var(--wb-surface-hover)',
          '&::after': {
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
          },
        },
      },
    },
  },
})
