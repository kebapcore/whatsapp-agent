import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    styled
} from '@mui/material';

const HighlightCard = styled(Card)(({ theme }) => ({
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderLeft: `4px solid ${theme.palette.warning.main}`,
    '& .MuiCardContent-root': {
        paddingBottom: 16
    }
}));

const OperatorPanel = ({ message, onRespond }) => {
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!response.trim()) return;

        try {
            setLoading(true);
            await onRespond(response);
            setResponse('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <HighlightCard>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#ffd700',
                            mr: 1,
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.5 }
                            }
                        }}
                    />
                    <Typography variant="h6">
                        Operator Intervention Required
                    </Typography>
                </Box>

                <Alert severity="warning" sx={{ mb: 2 }}>
                    The AI assistant needs your input to proceed.
                </Alert>

                <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        <strong>Request:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {message}
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Your response"
                    placeholder="Enter your response or instructions..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={loading || !response.trim()}
                        sx={{ flex: 1 }}
                    >
                        Send Response
                    </Button>
                </Box>
            </CardContent>
        </HighlightCard>
    );
};

export default OperatorPanel;
