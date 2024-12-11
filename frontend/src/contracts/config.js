import CertificateHelperABI from './abis/CertificateHelper.json';
import CertificateVerifierABI from './abis/CertificateVerifier.json';
import EducationCertificateABI from './abis/EducationCertificate.json';

export const CONTRACT_ADDRESSES = {
  EducationCertificate: import.meta.env.VITE_EDUCATION_CERTIFICATE_ADDRESS,
  CertificateHelper: import.meta.env.VITE_CERTIFICATE_HELPER_ADDRESS,
  CertificateVerifier: import.meta.env.VITE_CERTIFICATE_VERIFIER_ADDRESS,
};

export const CONTRACT_ABIS = {
  CertificateHelper: CertificateHelperABI,
  CertificateVerifier: CertificateVerifierABI,
  EducationCertificate: EducationCertificateABI,
}; 