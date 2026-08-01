import React from 'react';
import { Box, Typography, Divider, Avatar } from '@mui/material';
import Barcode from 'react-barcode';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import adityaLogo from '../../assets/Aditya University Gold Logo.png';

const EventPassCard = ({ participant }) => {
  if (!participant) return null;

  const getCollegeName = (p) => {
    return p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-');
  };

  return (
    <Box
      id="event-pass-card"
      sx={{
        width: '100%',
        maxWidth: 700,
        minWidth: 700, // force it to prevent squishing in PDF
        minHeight: 450, // ensure enough space for bottom venue section
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '3px solid #1d4ed8', // blue border
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Background Watermark */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '200px', fontWeight: 900, color: '#1d4ed8' }}>
          A
        </Typography>
      </Box>

      {/* Top Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', p: 3, zIndex: 1, position: 'relative' }}>
        {/* Left Logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '220px' }}>
          <Box component="img" src={adityaLogo} alt="Aditya University" sx={{ width: '100%', height: '60px', objectFit: 'contain', objectPosition: 'left' }} />
        </Box>

        {/* Center Title */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mt: 1 }}>
          <Typography sx={{ color: '#1d4ed8', fontWeight: 900, fontSize: '36px', letterSpacing: '1px', lineHeight: 1, whiteSpace: 'nowrap' }}>
            VEDA 2K26
          </Typography>
          <Typography sx={{ color: '#000', fontWeight: 600, fontSize: '18px', letterSpacing: '4px', mt: 1, whiteSpace: 'nowrap' }}>
            EVENT PASS
          </Typography>
          <Box sx={{ backgroundColor: '#1d4ed8', borderRadius: '24px', px: 4, py: 0.5, mt: 2 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap' }}>
              {participant.eventName || 'Code Reto'}
            </Typography>
          </Box>
        </Box>

        {/* Right Avatar */}
        <Box sx={{ width: '220px', display: 'flex', justifyContent: 'flex-end' }}>
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '3px solid #1d4ed8',
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
            }}
          >
            <Avatar sx={{ width: '100%', height: '100%' }} />
          </Box>
        </Box>
      </Box>

      {/* Middle Section */}
      <Box sx={{ display: 'flex', px: 3, pb: 3, pt: 1, zIndex: 1, position: 'relative' }}>
        {/* Left Details */}
        <Box sx={{ flex: 1, pr: 2 }}>
          {[
            { icon: <PersonIcon sx={{ color: '#1d4ed8' }} />, label: 'Name', value: participant.name },
            { icon: <BadgeIcon sx={{ color: '#1d4ed8' }} />, label: 'Roll', value: participant.roll },
            { icon: <SchoolIcon sx={{ color: '#1d4ed8' }} />, label: 'College', value: getCollegeName(participant) },
            { icon: <PhoneIcon sx={{ color: '#1d4ed8' }} />, label: 'Phone', value: participant.mobile },
          ].map((item, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ backgroundColor: '#eff6ff', borderRadius: '50%', p: 0.5, display: 'flex' }}>
                    {item.icon}
                  </Box>
                </Box>
                <Typography sx={{ color: '#1d4ed8', width: '80px', fontWeight: 600, ml: 1 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: '#000', fontWeight: 500 }}>
                  : {item.value || '-'}
                </Typography>
              </Box>
              {index < 3 && <Divider sx={{ borderColor: '#e2e8f0', ml: 6 }} />}
            </Box>
          ))}
        </Box>

        {/* Right Barcode */}
        <Box sx={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #e2e8f0', pl: 2 }}>
          <Box sx={{ border: '2px solid #1d4ed8', borderRadius: '24px', px: 3, py: 0.5, mb: 2 }}>
            <Typography sx={{ color: '#1d4ed8', fontWeight: 700, fontSize: '14px' }}>
              CODER ID
            </Typography>
          </Box>
          {participant.barcode ? (
            <Barcode 
              value={participant.barcode} 
              width={1.5} 
              height={60} 
              displayValue={false} 
              background="transparent" 
              lineColor="#000" 
              margin={0}
            />
          ) : (
            <Box sx={{ height: 60, width: '100%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">No Barcode</Typography>
            </Box>
          )}
          <Typography sx={{ color: '#000', fontWeight: 700, fontSize: '18px', mt: 1, letterSpacing: '2px' }}>
            {participant.barcode || '-'}
          </Typography>
        </Box>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ borderTop: '2px solid #1d4ed8', py: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', px: 2, textAlign: 'center' }}>
        <LocationOnIcon sx={{ color: '#1d4ed8', fontSize: '28px', mr: 1, flexShrink: 0 }} />
        <Typography sx={{ color: '#1d4ed8', fontWeight: 800, fontSize: '14px' }}>
          VENUE : <span style={{ color: '#334155', fontWeight: 500 }}>{participant.venue || 'Aditya University, Kakinada, Andhra Pradesh – 533437'}</span>
        </Typography>
      </Box>
    </Box>
  );
};

export default EventPassCard;
