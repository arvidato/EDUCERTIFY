import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';

export function StudentDashboard() {
    const { contracts, account } = useWeb3();
    const [certificates, setCertificates] = useState([]);

    useEffect(() => {
        const loadCertificates = async () => {
            if (contracts.educationCertificate && account) {
                try {
                    const certs = await contracts.educationCertificate.getMyAllCertificates();
                    setCertificates(certs);
                } catch (error) {
                    console.error('Error loading certificates:', error);
                }
            }
        };

        loadCertificates();
    }, [contracts.educationCertificate, account]);

    return (
        <div className="dashboard">
            <h2>Student Dashboard</h2>
            <div className="certificates-list">
                <h3>My Certificates</h3>
                {certificates.map((cert, index) => (
                    <div key={index} className="certificate-card">
                        <p>Certificate Hash: {cert.certificateHash}</p>
                        <p>Type: {cert.certificateType}</p>
                        <p>Issuing University: {cert.university}</p>
                        <p>Issue Date: {new Date(cert.issueDate * 1000).toLocaleDateString()}</p>
                        <p>Status: {cert.isValid ? 'Valid' : 'Revoked'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
} 