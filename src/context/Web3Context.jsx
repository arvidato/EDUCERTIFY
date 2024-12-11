import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../contracts/config';
import EducationCertificateABI from '../contracts/EducationCertificate.json';
import CertificateHelperABI from '../contracts/CertificateHelper.json';
import CertificateVerifierABI from '../contracts/CertificateVerifier.json';

const Web3Context = createContext();

export function Web3Provider({ children }) {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contracts, setContracts] = useState({});
    const [account, setAccount] = useState(null);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                
                const educationCertificate = new ethers.Contract(
                    CONTRACT_ADDRESSES.educationCertificate,
                    EducationCertificateABI.abi,
                    signer
                );

                const certificateHelper = new ethers.Contract(
                    CONTRACT_ADDRESSES.certificateHelper,
                    CertificateHelperABI.abi,
                    signer
                );

                const certificateVerifier = new ethers.Contract(
                    CONTRACT_ADDRESSES.certificateVerifier,
                    CertificateVerifierABI.abi,
                    signer
                );

                setProvider(provider);
                setSigner(signer);
                setContracts({
                    educationCertificate,
                    certificateHelper,
                    certificateVerifier
                });

                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                }
            }
        };

        init();
    }, []);

    return (
        <Web3Context.Provider value={{ provider, signer, contracts, account }}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    return useContext(Web3Context);
} 