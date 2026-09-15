import React from 'react';
import './CountBand.css';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const CountBand = ({ items = [], total = null }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="count-band-wrapper">
      {items.map((item, index) => {
        return (
          <div 
            key={item.id} 
            className={`count-band-segment segment-${item.color}`}
            style={{ zIndex: items.length - index + 2 }}
          >
            <div className="segment-icon-wrapper">
              {item.icon}
            </div>
            <div className="segment-text-wrapper">
              <span className="segment-title">{item.title}</span>
              <span className="segment-value">{item.value}</span>
            </div>
            <div className="segment-chevron">
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </div>
          </div>
        );
      })}
      
      {total && (
        <div className="count-band-total" style={{ zIndex: 1 }}>
           <div className="total-divider" />
           <div className="total-text-wrapper">
             <span className="total-title">{total.title}</span>
             <span className="total-value">{total.value}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default CountBand;
