import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StatusValue = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
        borderBottom: 'none'
    }
}));

const SystemStatusPanel = ({ status }) => {
    const getConnectionColor = () => {
        return status.connectionState === 'connected' ? 'success' : 'default';
    };

    const getSessionColor = () => {
        return status.sessionState === 'ready' ? 'success' : 'warning';
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return 'No action yet';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    System Status
                </Typography>

                <Stack spacing={0}>
                    <StatusValue>
                        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                            Connection
                        </Typography>
                        <Chip
                            label={status.connectionState}
                            color={getConnectionColor()}
                            size="small"
                        />
                    </StatusValue>

                    <StatusValue>
                        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                            Session
                        </Typography>
                        <Chip
                            label={status.sessionState}
                            color={getSessionColor()}
                            size="small"
                        />
                    </StatusValue>

                    <StatusValue>
                        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                            Last Action
                        </Typography>
                        <Typography variant="body2">
                            {formatTime(status.lastAction)}
                        </Typography>
                    </StatusValue>

                    {status.memoryUsage && (
                        <>
                            <StatusValue>
                                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                                    Memory (Heap)
                                </Typography>
                                <Typography variant="body2">
                                    {(status.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                            </StatusValue>

                            <StatusValue>
                                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                                    Memory (Total)
                                </Typography>
                                <Typography variant="body2">
                                    {(status.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                            </StatusValue>
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default SystemStatusPanel;
