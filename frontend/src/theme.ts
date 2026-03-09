import { createTheme, Theme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';
import type {} from '@mui/x-date-pickers/themeAugmentation';

const OT_PRIMARY = '#4F46E5';
const OT_PRIMARY_DARK = '#3730A3';
const OT_CHARADE = '#1E293B';
const OT_PALE_SKY = '#64748B';
const OT_IRON = '#E2E8F0';
const OT_ATHENS_GRAY = '#F1F5F9';

const DARK_BG = '#0A0A0B';
const DARK_PAPER = '#141416';
const DARK_SURFACE = '#1C1C1F';
const DARK_BORDER = '#2A2A2E';
const DARK_TEXT_PRIMARY = '#E4E4E7';
const DARK_TEXT_SECONDARY = '#A1A1AA';
const DARK_PRIMARY = '#6366F1';
const DARK_PRIMARY_DARK = '#4F46E5';

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        fontWeight: 500,
        borderRadius: 4,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'small' as const,
      variant: 'outlined' as const,
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
      },
    },
  },
};

export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: OT_PRIMARY,
      dark: OT_PRIMARY_DARK,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: OT_CHARADE,
      light: OT_PALE_SKY,
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    divider: OT_IRON,
    text: {
      primary: OT_CHARADE,
      secondary: OT_PALE_SKY,
    },
    grey: {
      100: OT_ATHENS_GRAY,
      300: OT_IRON,
      500: OT_PALE_SKY,
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: OT_ATHENS_GRAY,
          },
        },
      },
    },
  },
});

export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: DARK_PRIMARY,
      dark: DARK_PRIMARY_DARK,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: DARK_TEXT_PRIMARY,
      light: DARK_TEXT_SECONDARY,
    },
    background: {
      default: DARK_BG,
      paper: DARK_PAPER,
    },
    divider: DARK_BORDER,
    text: {
      primary: DARK_TEXT_PRIMARY,
      secondary: DARK_TEXT_SECONDARY,
    },
    grey: {
      100: DARK_SURFACE,
      300: DARK_BORDER,
      500: DARK_TEXT_SECONDARY,
      800: DARK_SURFACE,
      900: DARK_BG,
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: DARK_PAPER,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
          border: `1px solid ${DARK_BORDER}`,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: DARK_SURFACE,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: DARK_PAPER,
          border: `1px solid ${DARK_BORDER}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: DARK_BORDER,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: DARK_TEXT_SECONDARY,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: DARK_BORDER,
        },
      },
    },
  },
});
