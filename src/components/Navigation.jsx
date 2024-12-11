import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export function Navigation() {
    const { account } = useWeb3();

    return (
        <nav className="navbar">
            <div className="nav-brand">Education Certificates</div>
            <div className="nav-links">
                <Link to="/university">University Dashboard</Link>
                <Link to="/student">Student Dashboard</Link>
                <Link to="/viewer">Viewer Dashboard</Link>
            </div>
            <div className="wallet-info">
                {account ? 
                    `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : 
                    'Not Connected'
                }
            </div>
        </nav>
    );
} 