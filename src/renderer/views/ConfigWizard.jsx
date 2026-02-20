import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    CardContent,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stepper,
    Step,
    StepLabel,
    Box,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Container)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)'
}));

const StyledCard = styled(Card)(({ theme }) => ({
    maxWidth: 700,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
}));

const BrowserOption = styled(Card)(({ theme, selected }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
    border: `2px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
    backgroundColor: selected ? 'rgba(6, 214, 160, 0.1)' : 'rgba(255, 255, 255, 0.03)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: selected ? theme.palette.primary.main : 'rgba(6, 214, 160, 0.3)'
    }
}));

const ConfigWizard = ({ onConfigComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState(null);
    const [browsers, setBrowsers] = useState([]);

    const steps = [
        'Browser Setup',
        'Puppeteer Settings',
        'Message Handling',
        'Gemini Configuration',
        'Operator Settings',
        'Storage',
        'Review & Save'
    ];

    useEffect(() => {
        loadInitialConfig();
    }, []);

    const loadInitialConfig = async () => {
        try {
            setIsLoading(true);
            const result = await window.electron.configWizard();
            setConfig(result.currentConfig);
            
            // Load available browsers
            const detectedBrowsers = [
                { name: 'Chrome', type: 'chrome', path: '/usr/bin/google-chrome' },
                { name: 'Chromium', type: 'chromium', path: '/usr/bin/chromium-browser' },
                { name: 'Brave', type: 'chrome', path: '/usr/bin/brave-browser' }
            ];
            setBrowsers(detectedBrowsers);
        } catch (err) {
            setError(`Failed to load configuration: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const updateConfig = (section, updates) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...updates
            }
        }));
    };

    const handleNext = () => {
        setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setActiveStep(prev => Math.max(prev - 1, 0));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            await window.electron.saveConfig(config);
            onConfigComplete();
        } catch (err) {
            setError(`Failed to save configuration: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !config) {
        return (
            <StyledContainer>
                <Box textAlign="center">
                    <CircularProgress size={60} />
                    <p>Loading configuration...</p>
                </Box>
            </StyledContainer>
        );
    }

    if (!config) return null;

    return (
        <StyledContainer>
            <StyledCard>
                <CardContent sx={{ p: 4 }}>
                    <h1 style={{ textAlign: 'center', marginBottom: 32 }}>WhatsApp Agent Setup</h1>

                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Step 0: Browser Setup */}
                    {activeStep === 0 && (
                        <Box>
                            <h3>Select Browser</h3>
                            <p style={{ color: '#b0b0b0', marginBottom: 16 }}>
                                Choose which browser to use for WhatsApp Web automation.
                            </p>
                            {browsers.map((browser) => (
                                <BrowserOption
                                    key={browser.type}
                                    selected={config.browser.type === browser.type}
                                    onClick={() => updateConfig('browser', { type: browser.type })}
                                >
                                    <ListItemText
                                        primary={browser.name}
                                        secondary={browser.path}
                                    />
                                </BrowserOption>
                            ))}

                            {config.browser.type === 'custom' && (
                                <TextField
                                    fullWidth
                                    label="Custom Browser Path"
                                    value={config.browser.chromiumPath || ''}
                                    onChange={(e) => updateConfig('browser', { chromiumPath: e.target.value })}
                                    margin="normal"
                                    placeholder="/path/to/chromium"
                                />
                            )}
                        </Box>
                    )}

                    {/* Step 1: Puppeteer Settings */}
                    {activeStep === 1 && (
                        <Box>
                            <h3>Puppeteer Settings</h3>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.browser.headless}
                                        onChange={(e) => updateConfig('browser', { headless: e.target.checked })}
                                    />
                                }
                                label="Headless Mode (Hidden Browser Window)"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!config.browser.sandbox}
                                        onChange={(e) => updateConfig('browser', { sandbox: !e.target.checked })}
                                    />
                                }
                                label="Disable Sandbox (Faster, Less Secure)"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.browser.performanceMode}
                                        onChange={(e) => updateConfig('browser', { performanceMode: e.target.checked })}
                                    />
                                }
                                label="Performance Mode (Disable Images & Plugins)"
                            />
                        </Box>
                    )}

                    {/* Step 2: Message Handling */}
                    {activeStep === 2 && (
                        <Box>
                            <h3>Message Response Behavior</h3>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.messageHandling.autoReplyEnabled}
                                        onChange={(e) => updateConfig('messageHandling', { autoReplyEnabled: e.target.checked })}
                                    />
                                }
                                label="Auto Reply Enabled"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.messageHandling.typingSimulation}
                                        onChange={(e) => updateConfig('messageHandling', { typingSimulation: e.target.checked })}
                                    />
                                }
                                label="Typing Simulation (More Natural)"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.messageHandling.replyToSpecific}
                                        onChange={(e) => updateConfig('messageHandling', { replyToSpecific: e.target.checked })}
                                    />
                                }
                                label="Reply to Specific Messages"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.messageHandling.learningMode}
                                        onChange={(e) => updateConfig('messageHandling', { learningMode: e.target.checked })}
                                    />
                                }
                                label="Learning Mode (Store Profiles)"
                            />

                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Group Message Handling</InputLabel>
                                <Select
                                    value={config.messageHandling.groupHandling}
                                    onChange={(e) => updateConfig('messageHandling', { groupHandling: e.target.value })}
                                    label="Group Message Handling"
                                >
                                    <MenuItem value="always">Respond to All Messages</MenuItem>
                                    <MenuItem value="mention_only">Mention/Reply Only</MenuItem>
                                    <MenuItem value="ignore">Ignore Group Messages</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Step 3: Gemini Configuration */}
                    {activeStep === 3 && (
                        <Box>
                            <h3>Gemini API Configuration</h3>
                            <TextField
                                fullWidth
                                type="password"
                                label="Gemini API Key"
                                value={config.gemini.apiKey || ''}
                                onChange={(e) => updateConfig('gemini', { apiKey: e.target.value })}
                                margin="normal"
                                helperText="Get your API key from Google AI Studio (aistudio.google.com)"
                            />

                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Model Selection</InputLabel>
                                <Select
                                    value={config.gemini.model}
                                    onChange={(e) => updateConfig('gemini', { model: e.target.value })}
                                    label="Model Selection"
                                >
                                    <MenuItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</MenuItem>
                                    <MenuItem value="gemini-2.0-flash">Gemini 2.0 Flash</MenuItem>
                                    <MenuItem value="gemini-1.5-pro">Gemini 1.5 Pro</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                type="number"
                                label="Temperature"
                                value={config.gemini.temperature}
                                onChange={(e) => updateConfig('gemini', { temperature: parseFloat(e.target.value) })}
                                margin="normal"
                                inputProps={{ min: 0, max: 1, step: 0.1 }}
                                helperText="0 = deterministic, 1 = creative"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.gemini.groundingSearch}
                                        onChange={(e) => updateConfig('gemini', { groundingSearch: e.target.checked })}
                                    />
                                }
                                label="Enable Google Search Grounding"
                            />
                        </Box>
                    )}

                    {/* Step 4: Operator Escalation */}
                    {activeStep === 4 && (
                        <Box>
                            <h3>Operator Escalation Rules</h3>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.operatorEscalation.requestHelpWhenNeeded}
                                        onChange={(e) => updateConfig('operatorEscalation', { requestHelpWhenNeeded: e.target.checked })}
                                    />
                                }
                                label="Request Help When Needed"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.operatorEscalation.manualOverrideAllowed}
                                        onChange={(e) => updateConfig('operatorEscalation', { manualOverrideAllowed: e.target.checked })}
                                    />
                                }
                                label="Allow Manual Override"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.operatorEscalation.silentMode}
                                        onChange={(e) => updateConfig('operatorEscalation', { silentMode: e.target.checked })}
                                    />
                                }
                                label="Silent Mode (No Notifications)"
                            />
                        </Box>
                    )}

                    {/* Step 5: Storage Settings */}
                    {activeStep === 5 && (
                        <Box>
                            <h3>Data Storage Settings</h3>
                            <TextField
                                fullWidth
                                type="number"
                                label="History Message Limit"
                                value={config.storage.historyLimit}
                                onChange={(e) => updateConfig('storage', { historyLimit: parseInt(e.target.value) })}
                                margin="normal"
                                inputProps={{ min: 10, max: 1000 }}
                                helperText="Number of messages to keep in memory"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.storage.attachmentStorage}
                                        onChange={(e) => updateConfig('storage', { attachmentStorage: e.target.checked })}
                                    />
                                }
                                label="Store Attachments"
                            />
                        </Box>
                    )}

                    {/* Step 6: Review & Save */}
                    {activeStep === 6 && (
                        <Box>
                            <h3>Review Configuration</h3>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Click <strong>Save & Continue</strong> to proceed with QR code login.
                            </Alert>
                            <Box sx={{ maxHeight: 400, overflow: 'auto', p: 2, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                                <pre>{JSON.stringify(config, null, 2)}</pre>
                            </Box>
                        </Box>
                    )}

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                        <Button
                            disabled={activeStep === 0 || isLoading}
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        {activeStep < steps.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={isLoading}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={isLoading || !config.gemini.apiKey}
                            >
                                {isLoading ? <CircularProgress size={24} /> : 'Save & Continue'}
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </StyledCard>
        </StyledContainer>
    );
};

export default ConfigWizard;
