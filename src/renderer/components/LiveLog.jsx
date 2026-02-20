import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    styled
} from '@mui/material';

const StyledTableCell = styled(TableCell)(({ theme, level }) => {
    const colors = {
        'error': '#ff6b6b',
        'warning': '#ffd700',
        'success': '#26de81',
        'info': '#4facfe',
        'debug': '#b0b0b0'
    };

    return {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        padding: '12px 8px',
        fontSize: '0.85rem',
        color: colors[level] || '#ffffff'
    };
});

const getLevelColor = (level) => {
    const colors = {
        'error': 'error',
        'warning': 'warning',
        'success': 'success',
        'info': 'info',
        'debug': 'default'
    };
    return colors[level] || 'default';
};

const LiveLog = ({ logs, logEndRef }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Real-time Log Stream
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Chip label={`Total logs: ${logs.length}`} size="small" variant="outlined" />
                </Box>

                <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'rgba(6, 214, 160, 0.1)' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        No logs yet. Waiting for events...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'rgba(6, 214, 160, 0.05)'
                                            }
                                        }}
                                    >
                                        <StyledTableCell level={log.level}>
                                            {log.timestamp instanceof Date
                                                ? log.timestamp.toLocaleTimeString()
                                                : new Date(log.timestamp).toLocaleTimeString()}
                                        </StyledTableCell>
                                        <StyledTableCell level={log.level}>
                                            <Chip
                                                label={log.level}
                                                size="small"
                                                color={getLevelColor(log.level)}
                                                variant="outlined"
                                            />
                                        </StyledTableCell>
                                        <StyledTableCell level={log.level}>
                                            {log.source}
                                        </StyledTableCell>
                                        <StyledTableCell level={log.level}>
                                            {log.message}
                                        </StyledTableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <div ref={logEndRef} />
            </CardContent>
        </Card>
    );
};

export default LiveLog;
