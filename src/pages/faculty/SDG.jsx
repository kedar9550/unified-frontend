import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    IconButton,
    Fade
} from '@mui/material';
import { Close as CloseIcon, Person as PersonIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const SDG = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(true);

    return (
        <>
            <PageHeader
                title="Sustainable Development Goals"
                subtitle="Track and manage contributions towards global sustainability targets"
                breadcrumbs={["Home", "Research", "SDG's"]}
            />

            <Dialog 
                open={open} 
                onClose={() => setOpen(false)}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
                PaperProps={{
                    sx: {
                        borderRadius: "24px",
                        background: "var(--bg-panel)",
                        border: "1px solid var(--border-color)",
                        boxShadow: "var(--shadow-premium)",
                        backdropFilter: "blur(20px)",
                        p: 3,
                        width: "100%",
                        maxWidth: "650px",
                        position: "relative"
                    }
                }}
            >
                <IconButton 
                    onClick={() => setOpen(false)} 
                    sx={{ 
                        position: "absolute",
                        right: 20,
                        top: 20,
                        color: "var(--text-secondary)",
                        "&:hover": { color: "var(--text-primary)" }
                    }}
                >
                    <CloseIcon sx={{ fontSize: 28 }} />
                </IconButton>

                <DialogContent sx={{ textAlign: "center", py: 6, px: 4 }}>
                    <Box sx={{ 
                        width: 160, 
                        height: 160, 
                        borderRadius: "50%", 
                        border: "2.5px solid var(--color-primary)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        margin: "0 auto 40px",
                        position: "relative",
                        background: "var(--bg-glass)"
                    }}>
                        <PersonIcon sx={{ color: "var(--color-primary)", fontSize: 56 }} />
                    </Box>

                    <Typography sx={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.9rem", 
                        fontWeight: 800, 
                        textTransform: "uppercase", 
                        letterSpacing: "2.5px",
                        opacity: 0.8,
                        mb: 1
                    }}>
                        This Module Developed By
                    </Typography>

                    <Typography sx={{ 
                        color: "var(--text-primary)", 
                        fontSize: "2.8rem", 
                        fontWeight: 900, 
                        mt: 1,
                        lineHeight: 1.1,
                        textShadow: "var(--shadow-premium)"
                    }}>
                        Varikooti Siva Surya
                    </Typography>

                    <Typography sx={{ 
                        color: "var(--color-primary)", 
                        fontSize: "1.4rem", 
                        fontWeight: 700,
                        mt: 1,
                        letterSpacing: "1px",
                        fontFamily: "'Space Mono', monospace"
                    }}>
                        21A91A0563
                    </Typography>

                    <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid var(--border-color)" }}>
                        <Typography sx={{ 
                            color: "var(--text-secondary)", 
                            fontSize: "0.95rem", 
                            fontWeight: 500,
                            fontStyle: "italic"
                        }}>
                            "Engineering the future of sustainability, one line of code at a time."
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SDG;