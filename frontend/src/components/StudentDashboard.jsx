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
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Tbody,
  Tr,
  Td,
  useToast,
  Link,
  HStack,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';

function StudentDashboard({ contracts, account, certificates }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const toast = useToast();
  const [viewingData, setViewingData] = useState(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sharingDuration, setSharingDuration] = useState('7');
  const [viewerAddress, setViewerAddress] = useState('');

  const handleViewDetails = (certificate) => {
    setSelectedCertificate(certificate);
    onOpen();
  };

  const handleViewIPFS = async (ipfsHash, type) => {
    if (!ipfsHash) {
      toast({
        title: 'Error',
        description: 'No IPFS hash available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setViewingData(data);
      setIsDataModalOpen(true);
    } catch (error) {
      console.error('Error fetching IPFS data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data. Try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareCertificate = async (certificate) => {
    try {
      if (!viewerAddress) {
        toast({
          title: 'Error',
          description: 'Please enter a viewer address',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const durationInSeconds = parseInt(sharingDuration) * 24 * 60 * 60; // Convert days to seconds
      const tx = await contracts.educationCertificate.authorizeViewer(
        certificate.certificateHash,
        viewerAddress,
        durationInSeconds
      );
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Certificate shared successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setViewerAddress('');
    } catch (error) {
      console.error('Error sharing certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to share certificate',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={6}>Student Dashboard</Heading>
      
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>My Certificates</Tab>
          <Tab>Share Certificates</Tab>
          <Tab>View Grades</Tab>
          <Tab>Profile</Tab>
        </TabList>

        <TabPanels>
          {/* Certificates Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {certificates.map((cert, index) => (
                <Card key={index} variant="outline">
                  <CardHeader>
                    <Heading size="md">Certificate {index + 1}</Heading>
                    <Badge 
                      colorScheme={cert.isValid ? 'green' : 'red'}
                      mt={2}
                    >
                      {cert.isValid ? 'Valid' : 'Revoked'}
                    </Badge>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Text><strong>Hash:</strong> {cert.certificateHash.slice(0, 15)}...</Text>
                      <Text><strong>University:</strong> {cert.university.slice(0, 10)}...</Text>
                      <Text>
                        <strong>Issue Date:</strong> {' '}
                        {new Date(cert.issueDate * 1000).toLocaleDateString()}
                      </Text>
                      <Text><strong>Type:</strong> {cert.certificateType}</Text>
                      <Text><strong>NFT Hash:</strong> {cert.ipfsHash}</Text>
                      <Text><strong>Certificate Data:</strong> {cert.ipfsNFTHash}</Text>
                      <Text><strong>Grades Data:</strong> {cert.ipfsGradesHash}</Text>
                      <Button 
                        size="sm" 
                        colorScheme="blue"
                        onClick={() => handleViewDetails(cert)}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
            {certificates.length === 0 && (
              <Box textAlign="center" py={10}>
                <Text>No certificates found</Text>
              </Box>
            )}
          </TabPanel>

          {/* Share Certificates Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={6}>
                  <Box>
                    <Heading size="md" mb={4}>Share Certificate</Heading>
                    <Text mb={4}>Share your certificates with employers or institutions.</Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {certificates.map((cert, index) => (
                        <Card key={index} variant="outline">
                          <CardBody>
                            <Stack spacing={3}>
                              <Text><strong>Type:</strong> {cert.certificateType}</Text>
                              <Text>
                                <strong>Issue Date:</strong> {' '}
                                {new Date(cert.issueDate * 1000).toLocaleDateString()}
                              </Text>
                              <Badge colorScheme={cert.isValid ? 'green' : 'red'}>
                                {cert.isValid ? 'Valid' : 'Revoked'}
                              </Badge>
                              
                              <FormControl>
                                <FormLabel>Viewer Address</FormLabel>
                                <Input
                                  placeholder="0x..."
                                  value={viewerAddress}
                                  onChange={(e) => setViewerAddress(e.target.value)}
                                  size="sm"
                                />
                              </FormControl>
                              
                              <FormControl>
                                <FormLabel>Duration (days)</FormLabel>
                                <Input
                                  type="number"
                                  value={sharingDuration}
                                  onChange={(e) => setSharingDuration(e.target.value)}
                                  min="1"
                                  max="365"
                                  size="sm"
                                />
                              </FormControl>
                              
                              <Button
                                colorScheme="blue"
                                size="sm"
                                onClick={() => handleShareCertificate(cert)}
                                isDisabled={!cert.isValid}
                              >
                                Share Certificate
                              </Button>
                            </Stack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                    
                    {certificates.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Text>No certificates available to share</Text>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* View Grades Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={4}>
                  <Heading size="md">Academic Grades</Heading>
                  <Text color="gray.600">
                    View your academic performance and grades for all courses.
                  </Text>
                  {/* Add grades display functionality here */}
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Profile Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={4}>
                  <Heading size="md">Student Profile</Heading>
                  <Text><strong>Address:</strong> {account}</Text>
                  <Text><strong>Total Certificates:</strong> {certificates.length}</Text>
                  <Divider />
                  <Text><strong>DID:</strong> did:eth:{account}</Text>
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Certificate Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Certificate Details
            <Badge 
              ml={2}
              colorScheme={selectedCertificate?.isValid ? 'green' : 'red'}
            >
              {selectedCertificate?.isValid ? 'Valid' : 'Revoked'}
            </Badge>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCertificate && (
              <Stack spacing={4}>
                <Table variant="simple">
                  <Tbody>
                    <Tr>
                      <Td fontWeight="bold">Certificate Hash</Td>
                      <Td wordBreak="break-all">{selectedCertificate.certificateHash}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Certificate Type</Td>
                      <Td>{selectedCertificate.certificateType}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Issuing University</Td>
                      <Td wordBreak="break-all">{selectedCertificate.university}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Issue Date</Td>
                      <Td>
                        {new Date(selectedCertificate.issueDate * 1000).toLocaleString()}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">NFT Image/Metadata</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text wordBreak="break-all">{selectedCertificate.ipfsHash}</Text>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleViewIPFS(selectedCertificate.ipfsHash)}
                          >
                            View NFT
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">NFT Certificate Data</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text wordBreak="break-all">{selectedCertificate.ipfsNFTHash}</Text>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleViewIPFS(selectedCertificate.ipfsNFTHash)}
                            isLoading={isLoading}
                          >
                            View Data
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Grades Data</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text wordBreak="break-all">{selectedCertificate.ipfsGradesHash}</Text>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleViewIPFS(selectedCertificate.ipfsGradesHash)}
                            isLoading={isLoading}
                          >
                            View Grades
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>

                <Divider />

                <Box>
                  <Heading size="sm" mb={2}>NFT Certificate</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    View your NFT certificate image/metadata
                  </Text>
                  <Link
                    href={`https://gateway.pinata.cloud/ipfs/${selectedCertificate.ipfsHash}`}
                    isExternal
                    color="blue.500"
                  >
                    View NFT on IPFS
                  </Link>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>Certificate Data</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    View your detailed certificate information
                  </Text>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleViewIPFS(selectedCertificate.ipfsNFTHash)}
                  >
                    View Certificate Data
                  </Button>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>Academic Grades</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    View your detailed grade information
                  </Text>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleViewIPFS(selectedCertificate.ipfsGradesHash)}
                  >
                    View Grades Data
                  </Button>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>Certificate Verification</Heading>
                  <Text fontSize="sm" color="gray.600">
                    This certificate can be verified on-chain using the certificate hash.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>Share Certificate</Heading>
                  <Button 
                    size="sm" 
                    colorScheme="blue"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCertificate.certificateHash);
                      toast({
                        title: 'Certificate Hash Copied',
                        description: 'The certificate hash has been copied to your clipboard',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                  >
                    Copy Certificate Hash
                  </Button>
                </Box>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* JSON Data Modal */}
      <Modal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Certificate Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoading ? (
              <Box textAlign="center" py={4}>
                <Text>Loading data...</Text>
              </Box>
            ) : viewingData ? (
              <Box>
                <Box 
                  bg="gray.50" 
                  p={4} 
                  borderRadius="md"
                  maxH="500px"
                  overflowY="auto"
                >
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(viewingData, null, 2)}
                  </pre>
                </Box>
                <Button
                  mt={4}
                  size="sm"
                  colorScheme="blue"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(viewingData, null, 2));
                    toast({
                      title: 'Copied',
                      description: 'Data copied to clipboard',
                      status: 'success',
                      duration: 2000,
                      isClosable: true,
                    });
                  }}
                >
                  Copy Data
                </Button>
              </Box>
            ) : (
              <Text>No data available</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default StudentDashboard; 