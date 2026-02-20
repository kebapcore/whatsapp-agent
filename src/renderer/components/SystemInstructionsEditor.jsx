import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const EditorCard = styled(Card)(({ theme }) => ({
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    '& .MuiCardContent-root': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }
}));

const SystemInstructionsEditor = () => {
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [autoReload, setAutoReload] = useState(true);

    useEffect(() => {
        loadInstructions();
    }, []);

    const loadInstructions = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await window.electron.getSystemInstructions();
            if (result.success) {
                setInstructions(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(`Failed to load instructions: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const result = await window.electron.saveSystemInstructions(instructions);
            
            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(`Failed to save instructions: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm('Reset to default instructions? This cannot be undone.')) {
            try {
                setLoading(true);
                const result = await window.electron.getDefaultSystemInstructions();
                if (result.success) {
                    setInstructions(result.data);
                    await window.electron.saveSystemInstructions(result.data);
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                }
            } catch (err) {
                setError(`Failed to reset: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Gemini System Instructions
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                Edit the system instructions that guide the Gemini AI behavior. Changes take effect after saving.
            </Alert>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Instructions saved successfully!</Alert>}

            <EditorCard sx={{ mb: 3 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={20}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        disabled={saving}
                        variant="outlined"
                        placeholder="Enter system instructions..."
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                fontFamily: 'monospace',
                                fontSize: '0.85rem'
                            }
                        }}
                    />
                </CardContent>
            </EditorCard>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !instructions.trim()}
                    sx={{ minWidth: 120 }}
                >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>

                <Button
                    variant="outlined"
                    onClick={handleReset}
                    disabled={saving}
                >
                    Reset to Default
                </Button>

                <FormControlLabel
                    control={
                        <Switch
                            checked={autoReload}
                            onChange={(e) => setAutoReload(e.target.checked)}
                        />
                    }
                    label="Auto-reload Agent after save"
                />
            </Box>

            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#909090' }}>
                Instructions saved to: ~/.whatsapp-agent/gemini.txt
            </Typography>
        </Box>
    );
};

export default SystemInstructionsEditor;
