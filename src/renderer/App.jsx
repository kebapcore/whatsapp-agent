import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { darkTheme } from './theme/darkTheme';
import ConfigWizard from './views/ConfigWizard';
import Dashboard from './views/Dashboard';
import './App.css';

function App() {
    const [isConfigured, setIsConfigured] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkConfiguration();
    }, []);

    const checkConfiguration = async () => {
        try {
            const hasConfig = await window.electron.checkConfigExists();
            setIsConfigured(hasConfig);
        } catch (error) {
            console.error('Error checking configuration:', error);
            setIsConfigured(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigComplete = () => {
        setIsConfigured(true);
    };

    if (isLoading) {
        return (
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <div className="app-loading">
                    <div className="spinner"></div>
                    <p>Initializing...</p>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            {!isConfigured ? (
                <ConfigWizard onConfigComplete={handleConfigComplete} />
            ) : (
                <Dashboard />
            )}
        </ThemeProvider>
    );
}

export default App;
