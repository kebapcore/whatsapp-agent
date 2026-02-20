import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Box,
    AppBar,
    Toolbar,
    Tabs,
    Tab,
    Button,
    Card,
    CardContent,
    TextField,
    CircularProgress,
    Alert,
    Chip,
    Grid,
    Paper,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import QRCodeComponent from '../components/QRCode';
import LiveLog from '../components/LiveLog';
import OperatorPanel from '../components/OperatorPanel';
import SystemStatusPanel from '../components/SystemStatusPanel';
import SystemInstructionsEditor from '../components/SystemInstructionsEditor';

const DashboardContainer = styled(Box)({
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    paddingBottom: 24
});

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: 'linear-gradient(90deg, rgba(6, 214, 160, 0.1) 0%, rgba(187, 134, 252, 0.1) 100%)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
}));

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const Dashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    const [whatsappReady, setWhatsappReady] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [operatorNeeded, setOperatorNeeded] = useState(false);
    const [operatorMessage, setOperatorMessage] = useState('');
    const [status, setStatus] = useState({
        connectionState: 'disconnected',
        sessionState: 'not_initialized',
        lastAction: null
    });
    const logEndRef = useRef(null);
    const [showRestartDialog, setShowRestartDialog] = useState(false);

    useEffect(() => {
        initializeApp();
    }, []);

    useEffect(() => {
        // Listen for new logs from main process
        window.electron.onNewLog((log) => {
            setLogs(prev => [...prev.slice(-199), {
                ...log,
                id: Math.random().toString(36).substr(2, 9)
            }]);
        });

        // Listen for log clear
        window.electron.onClearLogs(() => {
            setLogs([]);
        });
    }, []);

    useEffect(() => {
        scrollLogsToBottom();
    }, [logs]);

    const initializeApp = async () => {
        try {
            setLoading(true);
            await window.electron.startWhatsApp();
            checkWhatsAppStatus();
        } catch (error) {
            addLog(`Startup error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkWhatsAppStatus = async () => {
        try {
            const isReady = await window.electron.isWhatsAppReady();
            setWhatsappReady(isReady);

            if (!isReady) {
                const qr = await window.electron.getQRCode();
                setQrCode(qr);
            } else {
                setQrCode(null);
            }

            const currentStatus = await window.electron.getWhatsAppStatus();
            setStatus(currentStatus);
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    const handleRestartAgent = async () => {
        try {
            setLoading(true);
            await window.electron.restartWhatsApp();
            checkWhatsAppStatus();
            addLog('Agent restarted successfully', 'success');
        } catch (error) {
            addLog(`Restart error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            setShowRestartDialog(false);
        }
    };

    const handleReconnect = async () => {
        try {
            setLoading(true);
            await window.electron.startWhatsApp();
            checkWhatsAppStatus();
            addLog('Reconnection attempt started', 'info');
        } catch (error) {
            addLog(`Reconnect error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        await window.electron.clearLogs();
        setLogs([]);
    };

    const handleOperatorResponse = async (response) => {
        try {
            await window.electron.sendOperatorResponse(response);
            setOperatorNeeded(false);
            addLog('Operator response sent', 'success');
        } catch (error) {
            addLog(`Failed to send operator response: ${error.message}`, 'error');
        }
    };

    const addLog = (message, level = 'info', source = 'dashboard') => {
        setLogs(prev => [...prev.slice(-199), {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            level,
            source,
            message
        }]);
    };

    const scrollLogsToBottom = () => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <DashboardContainer>
            <StyledAppBar position="sticky">
                <Toolbar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            WhatsApp Agent
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                            Production-ready AI automation
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                            label={status.connectionState}
                            size="small"
                            color={status.connectionState === 'connected' ? 'success' : 'default'}
                            variant="outlined"
                        />
                        <Chip
                            label={status.sessionState}
                            size="small"
                            color={status.sessionState === 'ready' ? 'primary' : 'default'}
                            variant="outlined"
                        />
                    </Box>
                </Toolbar>

                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                    <Tab label="Dashboard" id="tab-0" />
                    <Tab label="Live Logs" id="tab-1" />
                    <Tab label="System Instructions" id="tab-2" />
                </Tabs>
            </StyledAppBar>

            <Container maxWidth="xl" sx={{ mt: 4 }}>
                {/* Dashboard Tab */}
                <TabPanel value={tabValue} index={0}>
                    {!whatsappReady && !qrCode && (
                        <Box textAlign="center" py={4}>
                            <CircularProgress size={60} sx={{ mb: 2 }} />
                            <Typography>Initializing WhatsApp Web...</Typography>
                        </Box>
                    )}

                    {qrCode && !whatsappReady && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <strong>Scan the QR code with your phone to login to WhatsApp</strong>
                            </Alert>
                            <Box display="flex" justifyContent="center" mb={3}>
                                <QRCodeComponent value={qrCode} />
                            </Box>
                        </Box>
                    )}

                    {whatsappReady && (
                        <Box>
                            <Grid container spacing={3}>
                                {/* System Status */}
                                <Grid item xs={12} md={4}>
                                    <SystemStatusPanel status={status} />
                                </Grid>

                                {/* Control Buttons */}
                                <Grid item xs={12} md={8}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" sx={{ mb: 2 }}>
                                                Agent Controls
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => setShowRestartDialog(true)}
                                                    disabled={loading}
                                                >
                                                    Restart Agent
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleReconnect}
                                                    disabled={loading}
                                                >
                                                    Reconnect WhatsApp
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleClearLogs}
                                                >
                                                    Clear Logs
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Operator Panel */}
                                {operatorNeeded && (
                                    <Grid item xs={12}>
                                        <OperatorPanel
                                            message={operatorMessage}
                                            onRespond={handleOperatorResponse}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </TabPanel>

                {/* Live Logs Tab */}
                <TabPanel value={tabValue} index={1}>
                    <LiveLog logs={logs} logEndRef={logEndRef} />
                </TabPanel>

                {/* System Instructions Tab */}
                <TabPanel value={tabValue} index={2}>
                    <SystemInstructionsEditor />
                </TabPanel>
            </Container>

            {/* Restart Dialog */}
            <Dialog open={showRestartDialog} onClose={() => setShowRestartDialog(false)}>
                <DialogTitle>Restart Agent?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will restart the WhatsApp session and clear the current connection.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRestartDialog(false)}>Cancel</Button>
                    <Button onClick={handleRestartAgent} variant="contained" color="error">
                        Restart
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardContainer>
    );
};

export default Dashboard;
