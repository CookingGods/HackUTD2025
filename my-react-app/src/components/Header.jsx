import React from 'react';
import './Header.css';

const Header = () => {
    return (
        <header className="main-header">
            <div className="header-content">
                <div className="header-left"></div>
                <div className="header-logo">
                    <div className="header-branding">
                        <div className="header-title">
                            <span className="tmobile-text">T-Mobile</span>
                            <span className="dashboard-text">Dashboard</span>
                        </div>
                        <div className="powered-by-text">Powered By NVIDIA</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;