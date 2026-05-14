import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import {
    Box,
    Typography,
    Button,
    Tabs,
    Tab,
    Paper,
    Chip,
    IconButton,
    Collapse,
    Grid,
    CircularProgress,
    Dialog
} from '@mui/material';
import { sdgData } from '../../sdgData.js';
import {
    CloudUpload,
    ExpandMore,
    Close,
    Person,
    Badge,
    School,
    Code
} from '@mui/icons-material';
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import devProfileImg from "../../assets/K.Sudheer.jpeg";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import sdg1 from '../../assets/sdg-en-01.png';
import sdg2 from '../../assets/sdg-en-02.png';
import sdg3 from '../../assets/sdg-en-03.png';
import sdg4 from '../../assets/sdg-en-04.png';
import sdg5 from '../../assets/sdg-en-05.png';
import sdg6 from '../../assets/sdg-en-06.png';
import sdg7 from '../../assets/sdg-en-07.png';
import sdg8 from '../../assets/sdg-en-08.png';
import sdg9 from '../../assets/sdg-en-09.png';
import sdg10 from '../../assets/sdg-en-10.png';
import sdg11 from '../../assets/sdg-en-11.png';
import sdg12 from '../../assets/sdg-en-12.png';
import sdg13 from '../../assets/sdg-en-13.png';
import sdg14 from '../../assets/sdg-en-14.png';
import sdg15 from '../../assets/sdg-en-15.png';
import sdg16 from '../../assets/sdg-en-16.png';
import sdg17 from '../../assets/sdg-en-17.png';

const SDG_IMAGE_MAP = {
    "SDG-1": sdg1, "SDG-2": sdg2, "SDG-3": sdg3, "SDG-4": sdg4,
    "SDG-5": sdg5, "SDG-6": sdg6, "SDG-7": sdg7, "SDG-8": sdg8,
    "SDG-9": sdg9, "SDG-10": sdg10, "SDG-11": sdg11, "SDG-12": sdg12,
    "SDG-13": sdg13, "SDG-14": sdg14, "SDG-15": sdg15, "SDG-16": sdg16,
    "SDG-17": sdg17
};

const SDG_COLOR_MAP = {
    "SDG-1": "#E1222D", "SDG-2": "#D4A21D", "SDG-3": "#2F953F", "SDG-4": "#C42734",
    "SDG-5": "#E63D29", "SDG-6": "#22ACD9", "SDG-7": "#FAB805", "SDG-8": "#96273B",
    "SDG-9": "#EC6926", "SDG-10": "#DD1D7B", "SDG-11": "#F59D21", "SDG-12": "#D28E22",
    "SDG-13": "#4F7A3D", "SDG-14": "#177CBC", "SDG-15": "#43A73D", "SDG-16": "#1D5388",
    "SDG-17": "#2D3B66"
};

const SDGCard = ({ id, sdg, imageUrl, isExpanded, toggleExpand }) => {
    const containerRef = React.useRef(null);
    const [hasOverflow, setHasOverflow] = React.useState(false);
    const brandColor = SDG_COLOR_MAP[id];

    React.useEffect(() => {
        if (containerRef.current) {
            setHasOverflow(containerRef.current.scrollHeight > containerRef.current.clientHeight);
        }
    }, [sdg.keywords, isExpanded]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-glass)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    background: 'rgba(255, 255, 255, 0.04)',
                    transform: 'translateX(4px)'
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left Section / Header Image on Mobile */}
                <Box sx={{
                    width: { xs: '100%', md: 160 },
                    height: { xs: 140, md: 'auto' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    p: 0,
                    position: 'relative',
                    background: {
                        xs: brandColor,
                        md: isExpanded ? brandColor : 'transparent'
                    },
                    transition: 'background 0.4s ease'
                }}>
                    <Box
                        component="img"
                        src={imageUrl}
                        alt={sdg.title}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.5s ease',
                            '&:hover': {
                                transform: 'scale(1.05)'
                            }
                        }}
                    />
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flexGrow: 1, p: { xs: 1.5, md: 1.5 }, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                        {/* Keyword Preview Container (Fixed height when collapsed) */}
                        <Box
                            ref={containerRef}
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                flexGrow: 1,
                                maxHeight: isExpanded ? 'none' : { xs: '100px', md: '120px' },
                                overflow: 'hidden',
                                position: 'relative',
                                pb: 0.5
                            }}
                        >
                            {sdg.keywords.slice(0, 40).map((kw, i) => (
                                <Chip
                                    key={i}
                                    label={kw}
                                    size="small"
                                    sx={{
                                        background: 'var(--bg-accent-4)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        height: '24px',
                                        '&:hover': {
                                            background: 'var(--bg-accent-1)',
                                            color: 'var(--text-primary)',
                                        }
                                    }}
                                />
                            ))}
                            {!isExpanded && hasOverflow && (
                                <Typography sx={{
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    background: 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    ml: 1,
                                    mt: 0.2,
                                    whiteSpace: 'nowrap',
                                    alignSelf: 'center'
                                }}>
                                    +{sdg.keywords.length - 25} more...
                                </Typography>
                            )}
                        </Box>

                        {(hasOverflow || isExpanded) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                                <IconButton
                                    onClick={() => toggleExpand(id)}
                                    sx={{
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        color: isExpanded ? 'var(--color-primary)' : 'var(--text-secondary)',
                                        background: isExpanded ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                                        '&:hover': {
                                            color: 'var(--color-primary)',
                                            background: 'rgba(255, 215, 0, 0.15)',
                                            transform: isExpanded ? 'rotate(180deg) scale(1.1)' : 'scale(1.1)'
                                        }
                                    }}
                                >
                                    <ExpandMore />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Additional Content (Appears below the main row) */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {sdg.keywords.slice(25).map((kw, i) => (
                                    <Chip
                                        key={i + 25}
                                        label={kw}
                                        size="small"
                                        sx={{
                                            background: 'var(--bg-accent-4)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            height: '24px',
                                            '&:hover': {
                                                background: 'var(--bg-accent-1)',
                                                color: 'var(--text-primary)',
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Collapse>
                </Box>
            </Box>
        </Box>
    );
};

const InfoTableRow = ({ value, isLast }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 1.2,
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        transition: 'all 0.2s ease',
        '&:hover': {
            background: 'var(--bg-accent-4)'
        }
    }}>
        {/* Value Column */}
        <Typography sx={{
            fontWeight: 400,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            fontSize: '1.05rem',
            letterSpacing: '0.01em'
        }}>
            {value}
        </Typography>
    </Box>
);

const DeveloperPopup = ({ open, onClose }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: '28px',
                        position: 'relative',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-premium)',
                        overflow: 'visible'
                    }
                }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 20,
                    top: 20,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-accent-4)',
                    border: '1px solid var(--border-color)',
                    '&:hover': {
                        background: '#ef4444',
                        color: '#fff',
                        borderColor: '#ef4444',
                        transform: 'rotate(90deg)'
                    },
                    transition: 'all 0.3s ease'
                }}
            >
                <Close />
            </IconButton>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Typography variant="h4" sx={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    mt: 5,
                    mb: 1.5,
                    letterSpacing: '-0.03em',
                    fontSize: '1.2rem'
                }}>
                    SDG Module Developed by
                </Typography>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    width: '100%',
                    mb: 4
                }}>
                    <Box sx={{ height: '2px', width: '50px', background: 'var(--gradient-primary)', borderRadius: '1px', opacity: 0.5 }} />
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary-alpha)' }} />
                    <Box sx={{ height: '2px', width: '50px', background: 'var(--gradient-primary)', borderRadius: '1px', opacity: 0.5 }} />
                </Box>

                <Box sx={{
                    width: 170,
                    height: 170,
                    borderRadius: '50%',
                    padding: '4px',
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-premium)',
                    position: 'relative',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--bg-panel)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img
                            src={devProfileImg}
                            alt="Developer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </Box>
                </Box>

                {/* Unified Table Container */}
                <Box sx={{
                    width: '92%',
                    background: 'var(--bg-panel)',
                    borderRadius: '24px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    my: 2,
                    mx: 'auto'
                }}>
                    <InfoTableRow value="Kosireddi Sudheer" isLast={false} />
                    <InfoTableRow value="22P31A0424" isLast={false} />
                    <InfoTableRow value="Electronics and Communication Engineering" isLast={true} />
                </Box>
            </Box>
        </Dialog>
    );
};

const SDG = () => {
    const [tabValue, setTabValue] = useState(0);
    const [expandedId, setExpandedId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [matchedResults, setMatchedResults] = useState(null);
    const [showDevPopup, setShowDevPopup] = useState(true);
    const fileInputRef = React.useRef(null);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const fileName = file.name.toLowerCase();
        const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!isValidExtension) {
            alert('Please upload only PDF or Word documents (.pdf, .doc, .docx)');
            event.target.value = '';
            return;
        }

        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit.');
            event.target.value = '';
            return;
        }

        // Real Analysis
        setIsProcessing(true);
        setMatchedResults(null);

        try {
            let text = "";
            const fileReader = new FileReader();

            if (fileName.endsWith('.pdf')) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    fullText += content.items.map(item => item.str).join(" ") + " ";
                }
                text = fullText.toLowerCase();
            } else {
                // Word document
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value.toLowerCase();
            }

            // Keyword Matching Logic
            const results = {};
            Object.entries(sdgData).forEach(([id, data]) => {
                let matchCount = 0;
                data.keywords.forEach(keyword => {
                    const kw = keyword.toLowerCase();
                    if (kw.length > 2) { // Skip very short keywords for accuracy
                        // Using regex to find whole word matches
                        const regex = new RegExp(`\\b${kw}\\b`, 'g');
                        const matches = text.match(regex);
                        if (matches) {
                            matchCount += matches.length;
                        }
                    }
                });
                results[id] = matchCount;
            });

            // Delay slightly for UX/Progress feel
            setTimeout(() => {
                setMatchedResults(results);
                setIsProcessing(false);

                // Auto-scroll to results
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }, 1000);

        } catch (error) {
            console.error("Error processing file:", error);
            alert("Error reading file content. Please try again.");
            setIsProcessing(false);
        }
    };

    // Sub-component for the Results Grid
    const MatchedResults = ({ results }) => (
        <Box sx={{ mt: 6, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, borderBottom: '2px solid var(--border-color)', pb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    Matched SDGs
                </Typography>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(5, 1fr)'
                },
                gap: 2
            }}>
                {Object.entries(sdgData)
                    .filter(([id]) => results[id] > 0)
                    .map(([id, data]) => (
                        <Paper key={id} sx={{
                            p: 0,
                            borderRadius: '12px',
                            background: 'var(--bg-accent-4)',
                            border: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                borderColor: 'var(--color-primary)'
                            }
                        }}>
                            <Box
                                component="img"
                                src={SDG_IMAGE_MAP[id]}
                                sx={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                            <Box sx={{ p: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {data.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Total Matched: {results[id]}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <DeveloperPopup open={showDevPopup} onClose={() => setShowDevPopup(false)} />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
            />
            <PageHeader
                title="Sustainable Development Goals"
                subtitle="Track and manage contributions towards global sustainability targets"
                breadcrumbs={["Home", "Research", "SDG's"]}
            />

            <Paper
                elevation={0}
                sx={{
                    borderRadius: '24px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    mt: 1.5,
                    boxShadow: 'var(--shadow-premium)',
                }}
            >
                {/* Custom Tabs */}
                <Box sx={{ borderBottom: '1px solid var(--border-color)', px: 3, pt: 1 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTabs-indicator': {
                                background: 'var(--gradient-primary)',
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            },
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                minWidth: 'auto',
                                mr: 4,
                                py: 2,
                                color: 'var(--text-secondary)',
                                '&.Mui-selected': {
                                    color: 'var(--color-primary)'
                                }
                            }
                        }}
                    >
                        <Tab label="SDG Keyword Search" />
                        <Tab label="Full Keywords List" />
                    </Tabs>
                </Box>

                <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    {tabValue === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box
                                sx={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '24px',
                                    p: { xs: 2, md: 6 },
                                    textAlign: 'center',
                                    background: 'var(--bg-panel)',
                                    position: 'relative',
                                    transition: 'all 0.3s ease',
                                    minHeight: '350px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    '&:hover': {
                                        borderColor: 'var(--color-primary)',
                                        background: 'var(--bg-accent-1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                {isProcessing ? (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CircularProgress size={60} sx={{ color: 'var(--color-primary)', mb: 3 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                            Scanning Document...
                                        </Typography>
                                        <Typography sx={{ color: 'var(--text-secondary)', mt: 1 }}>
                                            Matching keywords with SDG goals
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        {/* Upload Icon Circle */}
                                        <Box
                                            sx={{
                                                width: 50,
                                                height: 50,
                                                borderRadius: '50%',
                                                background: 'var(--bg-accent-4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 24px',
                                                border: '1px solid var(--border-color)',
                                                boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <CloudUpload sx={{ fontSize: 25, color: 'var(--color-primary)' }} />
                                        </Box>

                                        <Typography sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 800,
                                            color: 'var(--text-primary)',
                                            mb: 1
                                        }}>
                                            Drop your file here
                                        </Typography>

                                        <Box sx={{ mt: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<CloudUpload />}
                                                onClick={handleUploadClick}
                                                sx={{
                                                    background: 'var(--gradient-primary)',
                                                    color: '#fff',
                                                    px: 6,
                                                    py: 1,
                                                    borderRadius: '100px',
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    boxShadow: '0 10px 30px var(--color-primary-alpha)',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 15px 40px var(--color-primary-alpha)',
                                                    }
                                                }}
                                            >
                                                Upload File
                                            </Button>

                                            {/* Info Text Row */}
                                            <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                                                <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    Supported formats: <Box component="span" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>PDF, DOCX</Box>
                                                </Typography>
                                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.5 }} />
                                                <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    Max file size: <Box component="span" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>10MB</Box>
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </>
                                )}
                            </Box>

                            {/* Analysis Results Grid */}
                            {matchedResults && <MatchedResults results={matchedResults} />}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {Object.entries(sdgData).map(([id, sdg]) => (
                                <SDGCard
                                    key={id}
                                    id={id}
                                    sdg={sdg}
                                    imageUrl={SDG_IMAGE_MAP[id]}
                                    isExpanded={expandedId === id}
                                    toggleExpand={toggleExpand}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default SDG;