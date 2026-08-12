import React, { useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import Barcode from 'react-barcode';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import adityaLogo from '../../assets/Aditya University Gold Logo.png';
import adityaCircleLogo from '../../assets/Circle_Gold.svg';

const EventPassCard = ({ participant, isPdf = false }) => {
  const [imageError, setImageError] = useState(false);

  if (!participant) return null;

  const getCollegeName = (p) => {
    return p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-');
  };

  const isFemale = participant.gender?.toLowerCase() === 'female';
  const primaryDark = '#061638';
  const primaryGold = '#c69a37';

  const dotPatternLight = {
    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1.5px, transparent 1.5px)`,
    backgroundSize: '10px 10px'
  };

  return (
    <Box sx={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
      zoom: isPdf ? 1 : { xs: 0.45, sm: 0.7, md: 1 }
    }}>
      <Box
        id="event-pass-card"
        sx={{
          width: '750px',
          height: '480px',
          margin: '0 auto',
          marginTop: '24px',
          marginBottom: '16px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: `1.5px solid ${primaryDark}`,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          display: 'flex',
          flexDirection: 'column'
        }}
      >

        {/* --- TOP CONTENT SECTION --- */}
        <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>

          {/* Photo Top Right */}
          <Box sx={{
            position: 'absolute',
            top: 15,
            right: 20,
            zIndex: 10
          }}>
            <Box sx={{
              width: 100,
              height: 125,
              borderRadius: '8px',
              border: `2px solid ${primaryGold}`,
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}>

              {!imageError ? (
                <Box
                  component="img"
                  crossOrigin="anonymous"
                  src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:9000"}/api/proxy/student-photo/${participant.roll}`}
                  alt={participant.name}
                  onError={() => setImageError(true)}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 0,
                    bgcolor: isFemale ? '#fdf2f8' : '#eff6ff',
                    color: isFemale ? '#db2777' : '#2563eb',
                    fontSize: '2rem'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 50 }} />
                </Avatar>
              )}
            </Box>
          </Box>

          {/* --- LEFT SIDEBAR --- */}
          <Box sx={{
            width: '260px',
            backgroundColor: primaryDark,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 2,
          }}>
            
            {/* Top Right Geometric Cut */}
            <Box sx={{ position: 'absolute', top: 0, right: isPdf ? -2 : 0, width: isPdf ? '82px' : '80px', height: '150px', zIndex: 1, pointerEvents: 'none' }}>
              <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                {/* White Corner */}
                <polygon points={isPdf ? "50,0 105,0 105,150 100,150" : "50,0 100,0 100,150"} fill="#fff" />
                {/* Gold Wedge */}
                <polygon points="35,0 50,0 100,150 85,150" fill={primaryGold} />
              </svg>
            </Box>

            {/* Top Left Dots */}
            <Box sx={{ 
              ...dotPatternLight, position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', 
              maskImage: 'radial-gradient(circle at top left, black, transparent 70%)', zIndex: 0 
            }} />
            
            {/* Bottom Left Dots */}
            <Box sx={{ 
              ...dotPatternLight, position: 'absolute', bottom: 0, left: 0, width: '180px', height: '150px', 
              maskImage: 'linear-gradient(to top right, black, transparent 60%)', zIndex: 0 
            }} />

            {/* Background Wave Accent (Subtle) */}
            <Box sx={{ position: 'absolute', bottom: 20, left: -20, zIndex: 0, opacity: 0.5 }}>
              <svg viewBox="0 0 240 80" style={{ width: '100%', height: '80px' }}>
                <path d="M 0 80 C 50 20 150 80 240 0" fill="none" stroke="#ffffff1a" strokeWidth="2" />
                <path d="M 0 60 C 80 0 180 60 260 -20" fill="none" stroke="#ffffff1a" strokeWidth="2" />
              </svg>
            </Box>

            <Box sx={{ p: 3, pt: 4, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1 }}>
              {/* Logo Area */}
              <Box component="img" src={adityaLogo} alt="Aditya Logo" sx={{ width: '180px', mb: 4, mr: 2 }} />

              {/* Sidebar Details Container */}
              <Box sx={{ width: '100%', pl: 1 }}>
                
                {/* Team ID */}
                {participant.teamId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', borderRadius: '50%', p: 0.8, mr: 1.5, display: 'flex' }}>
                      <GroupsIcon sx={{ color: primaryGold, fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', lineHeight: 1.2 }}>TEAM ID</Typography>
                      <Typography sx={{ color: primaryGold, fontSize: '12px', fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-all' }}>
                        {participant.teamId}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ width: '85%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1.5 }} />

                {/* Event Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', borderRadius: '50%', p: 0.8, mr: 1.5, display: 'flex' }}>
                    <CalendarMonthIcon sx={{ color: primaryGold, fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', lineHeight: 1.2 }}>EVENT DATE</Typography>
                    <Typography sx={{ color: primaryGold, fontSize: '12px', fontWeight: 800, lineHeight: 1.2 }}>SEP 15, 2026</Typography>
                  </Box>
                </Box>

                <Box sx={{ width: '85%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', my: 1.5 }} />

                {/* Venue */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)', borderRadius: '50%', p: 0.8, mr: 1.5, display: 'flex', mt: 0.5 }}>
                    <LocationOnIcon sx={{ color: primaryGold, fontSize: 24 }} />
                  </Box>
                  <Box sx={{ mt: 0.5 }}>
                    <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', lineHeight: 1.2 }}>VENUE</Typography>
                    <Typography sx={{ color: primaryGold, fontSize: '13px', fontWeight: 800, lineHeight: 1.3 }}>
                      {participant.venue || 'Room No: 021,\nBill Gates Bhavan -\nGROUND FLOOR'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

            </Box>
          </Box>

          {/* --- RIGHT CONTENT --- */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' }}>

            {/* Watermark */}
            <Box
              component="img"
              src={adityaCircleLogo}
              alt="Aditya Watermark"
              sx={{
                position: 'absolute',
                top: '55%',
                left: '42%',
                transform: 'translate(-50%, -50%)',
                width: '380px',
                opacity: 0.04,
                zIndex: 0,
                pointerEvents: 'none',
                filter: 'grayscale(100%)'
              }}
            />
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2.5, pb: 1, pr: 14 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ color: primaryDark, fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>
                  VEDA
                </Typography>
                <Typography sx={{ color: primaryGold, fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
                  2K26
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, width: '80%', justifyContent: 'center' }}>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: primaryGold }} />
                <Typography sx={{ color: '#000', fontSize: '16px', fontWeight: 600, letterSpacing: '6px' }}>
                  EVENT PASS
                </Typography>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: primaryGold }} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, position: 'relative', width: '250px', height: '38px', justifyContent: 'center' }}>
                <svg viewBox="0 0 250 38" preserveAspectRatio="none" style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
                  <polygon points="14,0 236,0 250,19 236,38 14,38 0,19" fill={primaryDark} />
                  <line x1="14" y1="0" x2="236" y2="0" stroke={primaryGold} strokeWidth="4" />
                  <line x1="14" y1="38" x2="236" y2="38" stroke={primaryGold} strokeWidth="4" />
                </svg>
                <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 700, lineHeight: 1, zIndex: 1, position: 'relative' }}>
                  {participant.eventName || 'Code Reto'}
                </Typography>
              </Box>
            </Box>

            {/* Details */}
            <Box sx={{ display: 'flex', px: 6, py: 1.5, flex: 1 }}>
              {/* Details List */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'center' }}>
                {[
                  { icon: <PersonIcon />, label: 'Name', value: participant.name ? participant.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : participant.name },
                  { icon: <BadgeIcon />, label: 'Roll', value: participant.roll },
                  { icon: <SchoolIcon />, label: 'College', value: getCollegeName(participant) },
                  { icon: <PhoneIcon />, label: 'Phone', value: participant.mobile },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                    <Box sx={{
                      backgroundColor: primaryDark,
                      color: '#fff',
                      borderRadius: '50%',
                      p: 0.5,
                      display: 'flex',
                      mr: 2,
                      mt: 0.2
                    }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 24 } })}
                    </Box>
                    <Typography sx={{ color: primaryDark, fontWeight: 700, fontSize: '20px', width: '100px', flexShrink: 0 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ color: primaryDark, fontWeight: 700, fontSize: '20px', mr: 1 }}>
                      :
                    </Typography>
                    <Typography sx={{
                      color: item.isVenue ? '#8b0000' : '#000',
                      fontWeight: 700,
                      fontSize: '20px',
                      flex: 1,
                      lineHeight: 1.3
                    }}>
                      {item.value || '-'}
                    </Typography>

                    {/* Faded Divider */}
                    {idx < 3 && (
                      <Box sx={{ position: 'absolute', bottom: -10, left: 40, right: 0, height: '1px', backgroundColor: 'rgba(0,0,0,0.08)' }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

          </Box>
        </Box>

        {/* --- BOTTOM BARCODE SECTION --- */}
        <Box sx={{
          height: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pt: 2,
          pb: 1,
          zIndex: 2,
          width: '100%',
          backgroundColor: '#fff',
          borderTop: `1.5px solid ${primaryDark}`,
          '& svg': {
            width: '95%',
            height: '70px',
            objectFit: 'contain'
          }
        }}>
          {participant.barcode ? (
            <>
              <Barcode
                value={participant.barcode}
                width={6.2}
                height={90}
                displayValue={false}
                background="transparent"
                lineColor="#000"
                margin={0}
              />
              <Typography sx={{ color: '#000', fontWeight: 700, fontSize: '14px', mt: 0.5, letterSpacing: '8px' }}>
                {participant.barcode}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">No Barcode</Typography>
          )}
        </Box>

      </Box>
    </Box>
  );
};

export default EventPassCard;
