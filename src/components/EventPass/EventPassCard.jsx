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
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Box 
          component="img" 
          src={adityaLogo} 
          alt="Watermark" 
          sx={{ width: '400px', opacity: 0.1 }} 
        />
      </Box>

      {/* Top Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 3, pt: 2, pb: 1, zIndex: 1, position: 'relative' }}>
        {/* Left Spacing */}
        <Box sx={{ width: '220px', display: 'flex', justifyContent: 'flex-start' }}>
        </Box>

        {/* Center Title */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, mt: 0 }}>
          <Typography sx={{ color: '#1d4ed8', fontWeight: 900, fontSize: '32px', letterSpacing: '1px', lineHeight: 1, whiteSpace: 'nowrap' }}>
            VEDA 2K26
          </Typography>
          <Typography sx={{ color: '#000', fontWeight: 600, fontSize: '16px', letterSpacing: '4px', mt: 1, whiteSpace: 'nowrap' }}>
            EVENT PASS
          </Typography>
          <Box sx={{ backgroundColor: '#1d4ed8', borderRadius: '24px', px: 3, py: 0.5, mt: 1.5 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap' }}>
              {participant.eventName || 'Code Reto'}
            </Typography>
          </Box>
        </Box>

        {/* Right Spacing */}
        <Box sx={{ width: '220px', display: 'flex', justifyContent: 'flex-end' }}>
        </Box>
      </Box>

      {/* Middle Section */}
      <Box sx={{ display: 'flex', px: 3, pb: 1, pt: 0, zIndex: 1, position: 'relative' }}>
        {/* Left Details */}
        <Box sx={{ flex: 1, pr: 2 }}>
          {[
            { icon: <PersonIcon sx={{ color: '#1d4ed8', fontSize: '20px' }} />, label: 'Name', value: participant.name },
            { icon: <BadgeIcon sx={{ color: '#1d4ed8', fontSize: '20px' }} />, label: 'Roll', value: participant.roll },
            { icon: <SchoolIcon sx={{ color: '#1d4ed8', fontSize: '20px' }} />, label: 'College', value: getCollegeName(participant) },
            { icon: <PhoneIcon sx={{ color: '#1d4ed8', fontSize: '20px' }} />, label: 'Phone', value: participant.mobile },
            { icon: <LocationOnIcon sx={{ color: '#1d4ed8', fontSize: '20px' }} />, label: 'Venue', value: participant.venue || 'Aditya University, Kakinada, Andhra Pradesh – 533437' },
          ].map((item, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                <Box sx={{ width: 36, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ backgroundColor: '#eff6ff', borderRadius: '50%', p: 0.5, display: 'flex' }}>
                    {item.icon}
                  </Box>
                </Box>
                <Typography sx={{ color: '#1d4ed8', width: '70px', fontWeight: 600, ml: 1, fontSize: '14px' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: item.label === 'Venue' ? '#a52a2a' : '#000', fontWeight: 700, fontSize: '16px', whiteSpace: 'nowrap' }}>
                  : {item.value || '-'}
                </Typography>
              </Box>
              {index < 4 && <Divider sx={{ borderColor: '#e2e8f0', ml: 5 }} />}
            </Box>
          ))}
        </Box>


        {/* Right Photo */}
        <Box sx={{ width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Box
            sx={{
              width: 105,
              height: 130,
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              border: '2px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            <Box
              component="img"
              crossOrigin="anonymous"
              src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:9000"}/api/proxy/student-photo/${participant.roll}`}
              alt={participant.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/105x130?text=No+Photo';
              }}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </Box>
        </Box>
      </Box>

      {/* Bottom Section (Barcode) */}
      <Box sx={{ borderTop: '2px solid #1d4ed8', py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', px: 1, width: '100%' }}>
        {participant.barcode ? (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Barcode 
              value={participant.barcode} 
              width={4} 
              height={100} 
              displayValue={false} 
              background="transparent" 
              lineColor="#000" 
              margin={0}
            />
            <Typography sx={{ color: '#000', fontWeight: 700, fontSize: '16px', mt: 0.5, letterSpacing: '4px' }}>
              {participant.barcode || '-'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: 60, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">No Barcode</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EventPassCard;
