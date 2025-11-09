import React from 'react';
import './Header.css';

const Header = () => {
    return (
        <header className="main-header">
            <div className="header-content">
                {/* Placeholder for left-side content */}
                <div className="header-left"></div>
                {/* T-Mobile Logo Placeholder on the right */}
                <div className="header-logo">
                    {/* Replace this <span> with an actual T-Mobile logo image */}
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e20074' }}>T-Mobile Dashboard</span>
                </div>
            </div>
        </header>
    );
};

export default Header;