import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../contracts/config';

// Import ABIs
import EducationCertificateABI from '../contracts/abis/EducationCertificate.json';
import CertificateHelperABI from '../contracts/abis/CertificateHelper.json';
import CertificateVerifierABI from '../contracts/abis/CertificateVerifier.json';

export function useContracts() {
  const [contracts, setContracts] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const initContracts = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create Web3Provider and get signer
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          
          // Wait for the provider to be ready
          await provider.ready;
          
          // Get the network
          const network = await provider.getNetwork();
          console.log('Connected to network:', network);

          const signer = provider.getSigner();
          setSigner(signer);

          // Initialize contracts with ABIs
          const educationCertificate = new ethers.Contract(
            CONTRACT_ADDRESSES.EducationCertificate,
            EducationCertificateABI.abi,
            signer
          );

          const certificateHelper = new ethers.Contract(
            CONTRACT_ADDRESSES.CertificateHelper,
            CertificateHelperABI.abi,
            signer
          );

          const certificateVerifier = new ethers.Contract(
            CONTRACT_ADDRESSES.CertificateVerifier,
            CertificateVerifierABI.abi,
            signer
          );

          setContracts({
            educationCertificate,
            certificateHelper,
            certificateVerifier,
          });
        } catch (error) {
          console.error('Error initializing contracts:', error);
        }
      }
    };

    initContracts();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {
          window.location.reload();
        });
      }
    };
  }, []);

  return { contracts, signer };
} 