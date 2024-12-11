import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';

export function UniversityDashboard() {
    const { contracts, account } = useWeb3();
    const [studentAddress, setStudentAddress] = useState('');
    const [certificateHash, setCertificateHash] = useState('');
    const [certificateType, setCertificateType] = useState('');
    const [ipfsHash, setIpfsHash] = useState('');
    const [studentDID, setStudentDID] = useState('');

    const issueCertificate = async (e) => {
        e.preventDefault();
        try {
            const tx = await contracts.educationCertificate.issueCertificate(
                studentAddress,
                certificateHash,
                certificateType,
                ipfsHash,
                studentDID
            );
            await tx.wait();
            alert('Certificate issued successfully!');
        } catch (error) {
            console.error('Error issuing certificate:', error);
            alert('Error issuing certificate. See console for details.');
        }
    };

    return (
        <div className="dashboard">
            <h2>University Dashboard</h2>
            <form onSubmit={issueCertificate}>
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
                <div>
                    <label>Certificate Type:</label>
                    <input 
                        type="text" 
                        value={certificateType} 
                        onChange={(e) => setCertificateType(e.target.value)}
                    />
                </div>
                <div>
                    <label>IPFS Hash:</label>
                    <input 
                        type="text" 
                        value={ipfsHash} 
                        onChange={(e) => setIpfsHash(e.target.value)}
                    />
                </div>
                <div>
                    <label>Student DID:</label>
                    <input 
                        type="text" 
                        value={studentDID} 
                        onChange={(e) => setStudentDID(e.target.value)}
                    />
                </div>
                <button type="submit">Issue Certificate</button>
            </form>
        </div>
    );
} 