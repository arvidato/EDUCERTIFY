import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';

export function ViewerDashboard() {
    const { contracts } = useWeb3();
    const [studentAddress, setStudentAddress] = useState('');
    const [certificateHash, setCertificateHash] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);

    const verifyCertificate = async (e) => {
        e.preventDefault();
        try {
            const requestId = await contracts.certificateVerifier.requestVerification(
                studentAddress,
                certificateHash
            );
            const result = await contracts.certificateVerifier.getVerificationDetails(requestId);
            setVerificationResult(result);
        } catch (error) {
            console.error('Error verifying certificate:', error);
            alert('Error verifying certificate. See console for details.');
        }
    };

    return (
        <div className="dashboard">
            <h2>Certificate Viewer Dashboard</h2>
            <form onSubmit={verifyCertificate}>
                <div>
                    <label>Student Address:</label>
                    <input 
                        type="text" 
                        value={studentAddress} 
                        onChange={(e) => setStudentAddress(e.target.value)}
                    />
                </div>
                <div>
                    <label>Certificate Hash:</label>
                    <input 
                        type="text" 
                        value={certificateHash} 
                        onChange={(e) => setCertificateHash(e.target.value)}
                    />
                </div>
                <button type="submit">Verify Certificate</button>
            </form>

            {verificationResult && (
                <div className="verification-result">
                    <h3>Verification Result</h3>
                    <p>Is Valid: {verificationResult.isVerified ? 'Yes' : 'No'}</p>
                    <p>Issuing University: {verificationResult.issuingUniversity}</p>
                    <p>Issue Date: {new Date(verificationResult.issueDate * 1000).toLocaleDateString()}</p>
                </div>
            )}
        </div>
    );
} 