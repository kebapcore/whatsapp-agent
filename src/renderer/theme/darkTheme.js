import { createTheme } from '@mui/material/styles';

// Material Design 3 Dark theme for WhatsApp Agent
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#06d6a0', // Modern teal/green
            light: '#33e9b7',
            dark: '#048a6f',
            contrastText: '#000000'
        },
        secondary: {
            main: '#bb86fc', // Purple accent
            light: '#d4b0ff',
            dark: '#8e58c6',
            contrastText: '#1f1f1f'
        },
        error: {
            main: '#ff6b6b',
            light: '#ff8a8a',
            dark: '#e74c3c'
        },
        warning: {
            main: '#ffd700',
            light: '#ffeb3b',
            dark: '#fbc02d'
        },
        success: {
            main: '#26de81',
            light: '#58ff8c',
            dark: '#20c979'
        },
        info: {
            main: '#4facfe',
            light: '#75c7ff',
            dark: '#0084ff'
        },
        background: {
            default: '#0f0f0f',
            paper: '#1a1a1a'
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
            disabled: '#606060'
        },
        divider: '#2a2a2a',
        action: {
            hover: '#2a2a2a',
            selected: '#333333',
            disabled: '#606060'
        }
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"'
        ].join(','),
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            letterSpacing: '-0.02em'
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            letterSpacing: '-0.01em'
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 600
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600
        },
        h5: {
            fontSize: '1.125rem',
            fontWeight: 500
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500
        },
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.5
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.43
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.4
        }
    },
    shape: {
        borderRadius: 12
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    padding: '10px 24px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                contained: {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)'
                    }
                },
                outlined: {
                    borderWidth: 2,
                    '&:hover': {
                        borderWidth: 2
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1a1a1a',
                    backgroundImage: 'linear-gradient(135deg, rgba(6, 214, 160, 0.05) 0%, rgba(187, 134, 252, 0.05) 100%)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#1a1a1a'
                },
                elevation1: {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }
            }
        },
        MuiInput: {
            styleOverrides: {
                root: {
                    '&.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(6, 214, 160, 0.2)'
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 8,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(6, 214, 160, 0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#06d6a0',
                        borderWidth: 2
                    }
                },
                notchedOutline: {
                    borderColor: 'rgba(255, 255, 255, 0.12)'
                }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                        color: '#06d6a0'
                    }
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1a1a1a',
                    backgroundImage: 'linear-gradient(135deg, rgba(6, 214, 160, 0.05) 0%, rgba(187, 134, 252, 0.05) 100%)',
                    borderRadius: 16
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    backgroundImage: 'linear-gradient(90deg, rgba(6, 214, 160, 0.03) 0%, rgba(187, 134, 252, 0.03) 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'none'
                }
            }
        }
    }
});
