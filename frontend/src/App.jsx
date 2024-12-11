import { useState, useEffect } from 'react';
import { useContracts } from './hooks/useContracts';
import { ChakraProvider, Box, Button, Center } from '@chakra-ui/react';
import ViewerDashboard from './components/ViewerDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import UniversityDashboard from './components/UniversityDashboard';
import './App.css';

function App() {
  const { contracts, signer } = useContracts();
  const [account, setAccount] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (contracts?.educationCertificate && account) {
        try {
          const owner = await contracts.educationCertificate.owner();
          console.log('Debug Info:', {
            owner: owner,
            currentAccount: account,
            isMatch: owner.toLowerCase() === account.toLowerCase(),
            contractAddress: contracts.educationCertificate.address
          });
          setIsAdmin(owner.toLowerCase() === account.toLowerCase());
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    checkAdmin();
  }, [contracts, account]);

  useEffect(() => {
    const getAccount = async () => {
      if (signer) {
        const address = await signer.getAddress();
        setAccount(address);
      }
    };
    getAccount();
  }, [signer]);

  useEffect(() => {
    const loadCertificates = async () => {
      if (contracts?.educationCertificate && account) {
        try {
          console.log('Loading certificates for account:', account);
          const certs = await contracts.educationCertificate.getMyAllCertificates();
          console.log('Loaded certificates:', certs);
          setCertificates(certs);
        } catch (error) {
          console.error('Error loading certificates:', error);
        }
      }
    };
    loadCertificates();
  }, [contracts, account]);

  useEffect(() => {
    const checkUserType = async () => {
      if (contracts?.educationCertificate && account) {
        try {
          // First check if user has a registered DID
          const userDID = await contracts.educationCertificate.userDIDs(account);
          console.log('User DID:', userDID);
          
          // Check if university
          const isUniversity = await contracts.educationCertificate.authorizedUniversities(account);
          console.log('Is University:', isUniversity);
          
          // If has DID but not university, then student
          if (userDID && !isUniversity) {
            setUserType('student');
          } else if (isUniversity) {
            setUserType('university');
          } else {
            setUserType('viewer');
          }
          
          console.log('Set user type to:', userType);
        } catch (error) {
          console.error('Error checking user type:', error);
        }
      }
    };

    checkUserType();
  }, [contracts, account]);

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="gray.50">
        {account ? (
          isAdmin ? (
            <AdminDashboard 
              contracts={contracts}
              account={account}
            />
          ) : userType === 'university' ? (
            <UniversityDashboard 
              contracts={contracts}
              account={account}
            />
          ) : userType === 'student' ? (
            <StudentDashboard 
              contracts={contracts}
              account={account}
              certificates={certificates}
            />
          ) : (
            <ViewerDashboard 
              contracts={contracts}
              account={account}
              certificates={certificates}
            />
          )
        ) : (
          <Center h="100vh">
            <Button
              colorScheme="blue"
              size="lg"
              onClick={async () => {
                if (window.ethereum) {
                  const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                  });
                  setAccount(accounts[0]);
                }
              }}
            >
              Connect Wallet
            </Button>
          </Center>
        )}
      </Box>
    </ChakraProvider>
  );
}

export default App; 