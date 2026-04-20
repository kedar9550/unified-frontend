import React from 'react';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <p className="footer-title">Unified Portal</p>
        <p className="footer-developed">Developed by <span style={{ color: '#0b5096' }}>IT Applications</span></p>
      </div>
    </footer>
  );
}
