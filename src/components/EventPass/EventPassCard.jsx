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

const EventPassCard = ({ participant }) => {
  const [imageError, setImageError] = useState(false);

  if (!participant) return null;

  const getCollegeName = (p) => {
    return p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-');
  };

  const isFemale = participant.gender?.toLowerCase() === 'female';
  const primaryDark = '#061638';
  const primaryGold = '#c69a37';

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      overflow: 'hidden',
      zoom: { xs: 0.45, sm: 0.7, md: 1 } 
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
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '1px solid #cbd5e1',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          display: 'flex'
        }}
      >
        {/* Background Accents for Right Side */}
        {/* Dots Pattern Top Right */}
        <Box sx={{
          position: 'absolute',
          top: 15,
          right: 20,
          width: 80,
          height: 80,
          opacity: 0.8,
          zIndex: 0
        }}>
          <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 10 }).map((_, row) => 
              Array.from({ length: 10 }).map((_, col) => (
                <circle 
                  key={`${row}-${col}`} 
                  cx={col * 8 + 4} 
                  cy={row * 8 + 4} 
                  r="1.5" 
                  fill="#061638" 
                />
              ))
            )}
          </svg>
        </Box>
        {/* Gold Lines Top Right */}
        <Box sx={{ position: 'absolute', top: 80, right: -10, transform: 'rotate(45deg)', zIndex: 0 }}>
          <Box sx={{ width: 60, height: 2, backgroundColor: primaryGold, mb: 1 }} />
          <Box sx={{ width: 80, height: 2, backgroundColor: primaryGold, ml: -10 }} />
        </Box>
        {/* Bottom Right Blue & Gold Waves */}
        <Box sx={{ position: 'absolute', bottom: -10, right: -10, zIndex: 0, width: 160, height: 80 }}>
          <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%' }}>
            <path d="M 50 150 C 80 80 180 50 300 0 L 300 150 Z" fill={primaryDark} />
            <path d="M 0 150 C 40 100 120 70 200 40 L 300 0" fill="none" stroke={primaryGold} strokeWidth="4" />
          </svg>
        </Box>

        {/* --- LEFT SIDEBAR --- */}
        <Box sx={{
          width: '240px',
          backgroundColor: primaryDark,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          borderTopLeftRadius: '16px',
          borderBottomLeftRadius: '16px',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'absolute', bottom: 40, left: -20, zIndex: 0 }}>
             <svg viewBox="0 0 240 80" style={{ width: '100%', height: '80px' }}>
                <path d="M 0 80 C 50 20 150 80 240 0" fill="none" stroke="#ffffff1a" strokeWidth="2" />
                <path d="M 0 60 C 80 0 180 60 260 -20" fill="none" stroke="#ffffff1a" strokeWidth="2" />
             </svg>
          </Box>
          
          <Box sx={{ p: 3, pt: 2, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            {/* Logo Area */}
            <Box component="img" src={adityaLogo} alt="Aditya Logo" sx={{ width: '130px', mb: 3 }} />

            {/* Team ID */}
            {participant.teamId && (
              <Box sx={{ 
                border: `1px solid ${primaryGold}`, 
                borderRadius: '8px', 
                p: 1.2, 
                width: '90%', 
                textAlign: 'center',
                mb: 2,
                backgroundColor: 'rgba(0,0,0,0.2)'
              }}>
                <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', lineHeight: 1 }}>TEAM ID</Typography>
                <Typography sx={{ color: primaryGold, fontSize: '12px', fontWeight: 700, mt: 0.5, wordBreak: 'break-all', lineHeight: 1 }}>
                  {participant.teamId}
                </Typography>
              </Box>
            )}

            {/* Event Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', width: '90%', mb: 2 }}>
              <CalendarMonthIcon sx={{ color: primaryGold, mr: 1.5, fontSize: 24 }} />
              <Box>
                <Typography sx={{ color: '#fff', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', lineHeight: 1.2 }}>EVENT DATE</Typography>
                <Typography sx={{ color: primaryGold, fontSize: '12px', fontWeight: 700, lineHeight: 1.2 }}>SEP 15, 2026</Typography>
              </Box>
            </Box>

            {/* Venue */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '90%', mb: 2 }}>
              <LocationOnIcon sx={{ color: primaryGold, mr: 1.5, fontSize: 24, mt: 0.2 }} />
              <Box>
                <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', lineHeight: 1.2 }}>VENUE</Typography>
                <Typography sx={{ color: primaryGold, fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>
                  {participant.venue || 'Room No: 021, Bill Gates Bhavan'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ width: '90%', height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', mb: 2 }} />

            {/* Photo */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 'auto', mb: 1 }}>
               <Box sx={{
                  width: 120,
                  height: 150,
                  borderRadius: '12px',
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
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <Avatar 
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: 0, 
                        bgcolor: isFemale ? '#fdf2f8' : '#eff6ff', 
                        color: isFemale ? '#db2777' : '#2563eb', 
                        fontSize: '3rem'
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                  )}
               </Box>
            </Box>
          </Box>
        </Box>

        {/* --- RIGHT CONTENT --- */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' }}>
          
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography sx={{ color: primaryDark, fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>
                VEDA
              </Typography>
              <Typography sx={{ color: primaryGold, fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>
                2K26
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, width: '60%', justifyContent: 'center' }}>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: primaryGold }} />
              <Typography sx={{ color: '#000', fontSize: '16px', fontWeight: 600, letterSpacing: '6px' }}>
                EVENT PASS
              </Typography>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: primaryGold }} />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              {/* Left Point */}
              <Box sx={{ 
                width: 0, height: 0, 
                borderTop: '19px solid transparent',
                borderBottom: '19px solid transparent',
                borderRight: `14px solid ${primaryDark}`
              }} />
              
              {/* Center Box */}
              <Box sx={{
                backgroundColor: primaryDark,
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                borderTop: `2px solid ${primaryGold}`,
                borderBottom: `2px solid ${primaryGold}`,
                boxSizing: 'border-box'
              }}>
                <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>
                  {participant.eventName || 'Code Reto'}
                </Typography>
              </Box>
              
              {/* Right Point */}
              <Box sx={{ 
                width: 0, height: 0, 
                borderTop: '19px solid transparent',
                borderBottom: '19px solid transparent',
                borderLeft: `14px solid ${primaryDark}`
              }} />
            </Box>
          </Box>

          {/* Details & Photo */}
          <Box sx={{ display: 'flex', px: 6, py: 2, flex: 1 }}>
            {/* Details List */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
              {[
                { icon: <PersonIcon />, label: 'Name', value: participant.name },
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

          {/* Barcode Area */}
          <Box sx={{ 
            height: '100px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            pb: 2,
            zIndex: 2
          }}>
             {participant.barcode ? (
              <>
                <Barcode 
                  value={participant.barcode} 
                  width={2.5} 
                  height={40} 
                  displayValue={false} 
                  background="transparent" 
                  lineColor="#000" 
                  margin={0}
                />
                <Typography sx={{ color: '#000', fontWeight: 700, fontSize: '14px', mt: 1, letterSpacing: '4px' }}>
                  {participant.barcode.replace(/(.{3})/g, '$1 ').trim()}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">No Barcode</Typography>
            )}
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default EventPassCard;
