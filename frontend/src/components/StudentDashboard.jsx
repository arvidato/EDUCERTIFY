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

  const handleViewDetails = (certificate) => {
    setSelectedCertificate(certificate);
    onOpen();
  };

  const handleViewIPFS = (ipfsHash) => {
    // Pinata Gateway URL
    const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(pinataGatewayUrl, '_blank');
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
                <Heading size="md" mb={4}>Share Certificates</Heading>
                <Text>Share your certificates with employers or institutions.</Text>
                {/* Add sharing functionality here */}
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
                      <Td fontWeight="bold">IPFS Hash</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text wordBreak="break-all">{selectedCertificate.ipfsHash}</Text>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleViewIPFS(selectedCertificate.ipfsHash)}
                          >
                            View Document
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>

                <Divider />

                <Box>
                  <Heading size="sm" mb={2}>IPFS Document</Heading>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    View the certificate document stored on IPFS
                  </Text>
                  <Link
                    href={`https://gateway.pinata.cloud/ipfs/${selectedCertificate.ipfsHash}`}
                    isExternal
                    color="blue.500"
                  >
                    View on Pinata Gateway
                  </Link>
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
                      // Add sharing functionality
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
    </Container>
  );
}

export default StudentDashboard; 