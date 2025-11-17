import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// Set up color mode config - use system preference by default
const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  colors: {
    primary: {
      50: '#e6e6ff',
      100: '#c4c6ff',
      200: '#a2a5fc',
      300: '#8183f4',
      400: '#6366f1', // Primary brand color
      500: '#4f46e5',
      600: '#4338ca',
      700: '#3730a3',
      800: '#312e81',
      900: '#1e1b4b'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    success: {
      500: '#10b981'
    },
    warning: {
      500: '#f59e0b'
    },
    error: {
      500: '#ef4444'
    }
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif"
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md'
      },
      variants: {
        solid: {
          bg: 'primary.400',
          color: 'white',
          _hover: {
            bg: 'primary.500'
          }
        },
        outline: {
          borderColor: 'primary.400',
          color: 'primary.400',
          _hover: {
            bg: 'primary.50'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'md',
          p: 4
        }
      }
    }
  },
  styles: {
    global: (props: any) => ({
      'html, body': {
        height: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
        // Use different background colors based on color mode
        bg: props.colorMode === 'dark' ? 'white' : 'gray.900',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
      '#root': {
        minHeight: '100vh',
        bg: props.colorMode === 'dark' ? 'white' : 'gray.900',
      },
      // Scrollbar styling for better dark mode
      '::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '::-webkit-scrollbar-track': {
        bg: props.colorMode === 'dark' ? 'gray.100' : 'gray.700',
      },
      '::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
        borderRadius: '8px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
      },
    })
  }
})

export default theme 