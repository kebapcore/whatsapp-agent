import React from 'react';
import QRCode from 'qrcode.react';
import { Box } from '@mui/material';

const QRCodeComponent = ({ value }) => {
    if (!value) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                padding: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                border: '2px solid rgba(6, 214, 160, 0.3)'
            }}
        >
            <QRCode
                value={value}
                size={300}
                level={'H'}
                includeMargin={true}
                fgColor="#ffffff"
                bgColor="#1a1a1a"
            />
        </Box>
    );
};

export default QRCodeComponent;
