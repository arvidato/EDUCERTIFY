import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Badge,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Image,
  Link,
  Center,
  Spinner,
} from '@chakra-ui/react';

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

const CertificateDetailsModal = ({ isOpen, onClose, certificate }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (certificate?.ipfsHash) {
      // Try Pinata gateway first, fallback to IPFS gateway
      setImageUrl(`${PINATA_GATEWAY}${certificate.ipfsHash}`);
    }
  }, [certificate]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Certificate Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* NFT Image */}
          {imageUrl && (
            <Box mb={6} borderRadius="md" overflow="hidden">
              <Image
                src={imageUrl}
                alt="Certificate NFT"
                width="100%"
                objectFit="contain"
                maxH="300px"
                fallback={
                  <Image
                    src={`${IPFS_GATEWAY}${certificate?.ipfsHash}`}
                    alt="Certificate NFT"
                    width="100%"
                    objectFit="contain"
                    maxH="300px"
                  />
                }
              />
            </Box>
          )}

          <Stack spacing={4}>
            <Box>
              <Text fontWeight="bold" color="gray.600">Student Address</Text>
              <Text>{certificate?.student}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" color="gray.600">Certificate Hash</Text>
              <Text>{certificate?.certificateHash}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" color="gray.600">University Address</Text>
              <Text>{certificate?.university}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" color="gray.600">Issue Date</Text>
              <Text>{new Date(certificate?.issueDate * 1000).toLocaleDateString()}</Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" color="gray.600">Certificate Type</Text>
              <Text>{certificate?.certificateType}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold" color="gray.600">Student DID</Text>
              <Text>{certificate?.studentDID}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold" color="gray.600">Issuer DID</Text>
              <Text>{certificate?.issuerDID}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold" color="gray.600">Status</Text>
              <Badge colorScheme={certificate?.isValid ? 'green' : 'red'}>
                {certificate?.isValid ? 'VALID' : 'REVOKED'}
              </Badge>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

function ViewerDashboard({ contracts, account, certificates }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [did, setDid] = useState('');
  const [registrationType, setRegistrationType] = useState('student');
  const [isRegistering, setIsRegistering] = useState(false);
  const toast = useToast();
  const [sharedCertificates, setSharedCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingData, setViewingData] = useState(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [searchHash, setSearchHash] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  const handleRegistration = async () => {
    if (!did) {
      toast({
        title: 'Error',
        description: 'Please enter a DID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsRegistering(true);
    try {
      console.log('Contract address:', contracts.educationCertificate.address);
      console.log('Current account:', account);

      // Format DID if not already formatted
      let formattedDid = did;
      if (!did.startsWith('did:eth:')) {
        formattedDid = `did:eth:${account}`;
      }
      console.log('DID to register:', formattedDid);

      // Check registration status first
      const status = await contracts.educationCertificate.checkRegistrationStatus(
        account,
        formattedDid
      );
      console.log('Registration status:', {
        hasExistingDID: status[0],
        isDIDRegistered: status[1],
        currentDID: status[2]
      });

      if (status[0]) {
        throw new Error(`Address already has a DID: ${status[2]}`);
      }
      if (status[1]) {
        throw new Error('This DID is already registered');
      }

      // Proceed with registration
      if (registrationType === 'university') {
        const tx = await contracts.educationCertificate.requestUniversityRegistration(
          formattedDid,
          { gasLimit: 500000 }
        );
        await tx.wait();
        toast({
          title: 'Success',
          description: 'University registration request submitted. Waiting for admin approval.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        const tx = await contracts.educationCertificate.registerDID(formattedDid, {
          gasLimit: 500000
        });
        console.log('Registration transaction:', tx);
        
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);

        if (receipt.status === 1) {
          toast({
            title: 'Success',
            description: 'DID registered successfully',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          throw new Error('Transaction failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to register. ';
      
      if (error.error?.data?.message) {
        errorMessage += error.error.data.message;
      } else if (error.data?.message) {
        errorMessage += error.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const loadSharedCertificates = async () => {
    try {
      if (!contracts?.educationCertificate || !account) {
        console.log('Contracts or account not ready:', { contracts, account });
        return;
      }

      // We'll need to listen to ViewerAuthorized events to find certificates shared with this viewer
      const filter = contracts.educationCertificate.filters.ViewerAuthorized(null, account);
      const events = await contracts.educationCertificate.queryFilter(filter);
      
      const certificates = await Promise.all(events.map(async (event) => {
        const [student, certificateHash] = [event.args[0], event.args[2]];
        
        // Check if viewer is still authorized
        const isAuthorized = await contracts.educationCertificate.isAuthorizedViewer(
          student,
          certificateHash,
          account
        );
        
        if (isAuthorized) {
          // Get certificate details
          const details = await contracts.educationCertificate.getCertificateDetails(
            student,
            certificateHash
          );
          
          return {
            student,
            certificateHash: details.certificateHash,
            university: details.university,
            issueDate: details.issueDate,
            certificateType: details.certificateType,
            isValid: details.isValid,
            ipfsHash: details.ipfsHash,
            issuerDID: details.issuerDID,
            studentDID: details.studentDID
          };
        }
        return null;
      }));

      // Filter out null values (unauthorized certificates)
      setSharedCertificates(certificates.filter(cert => cert !== null));
    } catch (error) {
      console.error('Error loading shared certificates:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: 'Failed to load shared certificates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleViewIPFS = async (ipfsHash) => {
    try {
      setIsLoading(true);
      
      // Try Pinata gateway first
      const response = await fetch(`${PINATA_GATEWAY}${ipfsHash}`);
      if (!response.ok) {
        throw new Error('Failed to fetch from Pinata');
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // Handle JSON data
        const data = await response.json();
        setViewingData(data);
        setIsDataModalOpen(true);
      } else if (contentType?.includes('image')) {
        // Handle image data
        const imageUrl = `${PINATA_GATEWAY}${ipfsHash}`;
        setViewingData({ type: 'image', url: imageUrl });
        setIsDataModalOpen(true);
      } else if (contentType?.includes('pdf')) {
        // Handle PDF data
        const pdfUrl = `${PINATA_GATEWAY}${ipfsHash}`;
        setViewingData({ type: 'pdf', url: pdfUrl });
        setIsDataModalOpen(true);
      } else {
        // Handle other data types
        const text = await response.text();
        setViewingData({ type: 'text', content: text });
        setIsDataModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching IPFS data:', error);
      // Try fallback to IPFS gateway
      try {
        const fallbackResponse = await fetch(`${IPFS_GATEWAY}${ipfsHash}`);
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch from IPFS');
        }
        const data = await fallbackResponse.json();
        setViewingData(data);
        setIsDataModalOpen(true);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        toast({
          title: 'Error',
          description: 'Failed to fetch certificate data from both gateways',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCertificate = async () => {
    if (!searchStudent || !searchHash) {
      toast({
        title: 'Error',
        description: 'Please enter both student address and certificate hash',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    try {
      const details = await contracts.educationCertificate.getCertificateDetails(
        searchStudent,
        searchHash
      );

      // Check if university is authorized
      const isUniversityAuthorized = await contracts.educationCertificate.authorizedUniversities(
        details.university
      );

      setVerificationResult({
        certificateHash: details.certificateHash,
        university: details.university,
        issueDate: details.issueDate,
        certificateType: details.certificateType,
        isValid: details.isValid,
        ipfsHash: details.ipfsHash,
        issuerDID: details.issuerDID,
        studentDID: details.studentDID,
        isUniversityAuthorized
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'Certificate not found or you are not authorized to view it',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setIsCertificateModalOpen(true);
  };

  useEffect(() => {
    if (contracts?.educationCertificate && account) {
      console.log('Initializing with:', { contracts, account });
      loadSharedCertificates();
    }
  }, [contracts, account]);

  // Add debug logging
  useEffect(() => {
    console.log('Current state:', {
      contracts,
      account,
      isInitializing,
      error,
      sharedCertificates
    });
  }, [contracts, account, isInitializing, error, sharedCertificates]);

  const DataModal = ({ isOpen, onClose, data, isLoading }) => (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Certificate Data</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Center py={8}>
              <Spinner />
            </Center>
          ) : data ? (
            <Box>
              {data.type === 'image' ? (
                <Image src={data.url} alt="Certificate" />
              ) : data.type === 'pdf' ? (
                <Link href={data.url} isExternal color="blue.500">
                  View PDF Document
                </Link>
              ) : data.type === 'text' ? (
                <Text whiteSpace="pre-wrap">{data.content}</Text>
              ) : (
                <Box
                  bg="gray.50"
                  p={4}
                  borderRadius="md"
                  maxH="500px"
                  overflowY="auto"
                >
                  <pre>{JSON.stringify(data, null, 2)}</pre>
                </Box>
              )}
            </Box>
          ) : (
            <Text>No data available</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <Container maxW="container.xl" py={5}>
      {isInitializing ? (
        <Center h="50vh">
          <Stack align="center" spacing={4}>
            <Spinner size="xl" />
            <Text>Loading certificates...</Text>
          </Stack>
        </Center>
      ) : error ? (
        <Center h="50vh">
          <Stack align="center" spacing={4}>
            <Text color="red.500">Error: {error}</Text>
            <Button
              colorScheme="blue"
              onClick={() => {
                setError(null);
                setIsInitializing(true);
                loadSharedCertificates();
              }}
            >
              Retry
            </Button>
          </Stack>
        </Center>
      ) : (
        <Box>
          <Heading mb={6}>Viewer Dashboard</Heading>
          
          <Tabs onChange={(index) => setSelectedTab(index)} colorScheme="blue">
            <TabList>
              <Tab>Shared Certificates</Tab>
              <Tab>Verify Certificate</Tab>
              <Tab>Profile</Tab>
            </TabList>

            <TabPanels>
              {/* Certificates Tab */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {sharedCertificates.map((cert, index) => (
                    <Card key={index} variant="outline">
                      <CardHeader>
                        <Heading size="md">Shared Certificate {index + 1}</Heading>
                        <Badge 
                          colorScheme={cert.isValid ? 'green' : 'red'}
                          mt={2}
                        >
                          {cert.isValid ? 'Valid' : 'Revoked'}
                        </Badge>
                      </CardHeader>
                      <CardBody>
                        <Stack spacing={3}>
                          <Text><strong>Student:</strong> {cert.student.slice(0, 10)}...</Text>
                          <Text><strong>Hash:</strong> {cert.certificateHash.slice(0, 15)}...</Text>
                          <Text><strong>University:</strong> {cert.university.slice(0, 10)}...</Text>
                          <Text>
                            <strong>Issue Date:</strong> {' '}
                            {new Date(cert.issueDate * 1000).toLocaleDateString()}
                          </Text>
                          <Text><strong>Type:</strong> {cert.certificateType}</Text>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleViewCertificate(cert)}
                          >
                            View Certificate Data
                          </Button>
                        </Stack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                {sharedCertificates.length === 0 && (
                  <Box textAlign="center" py={10}>
                    <Text>No shared certificates found</Text>
                  </Box>
                )}
              </TabPanel>

              {/* Verify Certificate Tab */}
              <TabPanel>
                <Card>
                  <CardBody>
                    <Stack spacing={6}>
                      <Box>
                        <Heading size="md" mb={4}>Verify a Certificate</Heading>
                        <Text mb={4}>Enter the student's address and certificate hash to verify its authenticity.</Text>
                        
                        <Stack spacing={4}>
                          <FormControl isRequired>
                            <FormLabel>Student Address</FormLabel>
                            <Input
                              placeholder="0x..."
                              value={searchStudent}
                              onChange={(e) => setSearchStudent(e.target.value)}
                            />
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>Certificate Hash</FormLabel>
                            <Input
                              placeholder="Enter certificate hash"
                              value={searchHash}
                              onChange={(e) => setSearchHash(e.target.value)}
                            />
                          </FormControl>

                          <Button
                            colorScheme="blue"
                            onClick={handleVerifyCertificate}
                            isLoading={isVerifying}
                            loadingText="Verifying..."
                          >
                            Verify Certificate
                          </Button>
                        </Stack>
                      </Box>

                      {verificationResult && (
                        <>
                          <Divider />
                          <Box>
                            <Heading size="md" mb={4}>Verification Result</Heading>
                            <Card variant="outline">
                              <CardBody>
                                <Stack spacing={3}>
                                  <Badge
                                    colorScheme={verificationResult.isValid ? 'green' : 'red'}
                                    fontSize="md"
                                    p={2}
                                    textAlign="center"
                                  >
                                    {verificationResult.isValid ? 'VALID CERTIFICATE' : 'INVALID OR REVOKED'}
                                  </Badge>

                                  <Text><strong>Certificate Type:</strong> {verificationResult.certificateType}</Text>
                                  <Text>
                                    <strong>Issue Date:</strong>{' '}
                                    {new Date(verificationResult.issueDate * 1000).toLocaleDateString()}
                                  </Text>
                                  <Text>
                                    <strong>Issuing University:</strong>{' '}
                                    {verificationResult.university}
                                    <Badge
                                      ml={2}
                                      colorScheme={verificationResult.isUniversityAuthorized ? 'green' : 'red'}
                                    >
                                      {verificationResult.isUniversityAuthorized ? 'Authorized' : 'Not Authorized'}
                                    </Badge>
                                  </Text>
                                  <Text><strong>Student DID:</strong> {verificationResult.studentDID}</Text>
                                  <Text><strong>Issuer DID:</strong> {verificationResult.issuerDID}</Text>
                                  
                                  {verificationResult.ipfsHash && (
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      onClick={() => handleViewIPFS(verificationResult.ipfsHash)}
                                    >
                                      View Certificate Data
                                    </Button>
                                  )}
                                </Stack>
                              </CardBody>
                            </Card>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Profile Tab */}
              <TabPanel>
                <Box>
                  <Heading size="md" mb={4}>Profile Information</Heading>
                  <Card mb={6}>
                    <CardBody>
                      <Stack spacing={4}>
                        <Text><strong>Account Address:</strong> {account}</Text>
                        <Text><strong>Network:</strong> {window.ethereum?.networkVersion === '1' ? 'Mainnet' : 'Testnet'}</Text>
                        <Text><strong>Total Certificates:</strong> {certificates.length}</Text>
                      </Stack>
                    </CardBody>
                  </Card>

                  <Divider my={6} />

                  <Heading size="md" mb={4}>Register as University/Student</Heading>
                  <Card>
                    <CardBody>
                      <Stack spacing={4}>
                        <FormControl>
                          <FormLabel>Registration Type</FormLabel>
                          <Select 
                            value={registrationType}
                            onChange={(e) => setRegistrationType(e.target.value)}
                          >
                            <option value="student">Student</option>
                            <option value="university">University</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>DID (Decentralized Identifier)</FormLabel>
                          <Input
                            placeholder="Enter your DID"
                            value={did}
                            onChange={(e) => setDid(e.target.value)}
                          />
                        </FormControl>

                        <Button
                          colorScheme="blue"
                          onClick={handleRegistration}
                          isLoading={isRegistering}
                          loadingText="Registering..."
                        >
                          Register
                        </Button>

                        {registrationType === 'university' && (
                          <Text fontSize="sm" color="gray.500">
                            Note: University registration requires approval from the contract owner.
                          </Text>
                        )}
                      </Stack>
                    </CardBody>
                  </Card>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <DataModal
            isOpen={isDataModalOpen}
            onClose={() => setIsDataModalOpen(false)}
            data={viewingData}
            isLoading={isLoading}
          />

          <CertificateDetailsModal 
            isOpen={isCertificateModalOpen}
            onClose={() => setIsCertificateModalOpen(false)}
            certificate={selectedCertificate}
          />
        </Box>
      )}
    </Container>
  );
}

export default ViewerDashboard; 