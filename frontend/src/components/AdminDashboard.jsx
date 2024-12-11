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
  Card,
  CardBody,
  Stack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';

function AdminDashboard({ contracts, account }) {
  const [universities, setUniversities] = useState([]);
  const [pendingUniversities, setPendingUniversities] = useState([]);
  const [newUniversityAddress, setNewUniversityAddress] = useState('');
  const [newUniversityDID, setNewUniversityDID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Load universities
  useEffect(() => {
    const loadUniversities = async () => {
      if (contracts?.educationCertificate) {
        try {
          // You might need to implement these events/methods in your smart contract
          const authorizedFilter = contracts.educationCertificate.filters.UniversityAuthorized();
          const revokedFilter = contracts.educationCertificate.filters.UniversityRevoked();
          
          const authorizedLogs = await contracts.educationCertificate.queryFilter(authorizedFilter);
          const revokedLogs = await contracts.educationCertificate.queryFilter(revokedFilter);
          
          // Process logs to get current authorized universities
          const currentUniversities = authorizedLogs
            .filter(log => !revokedLogs.some(revoked => 
              revoked.args.university === log.args.university
            ))
            .map(log => ({
              address: log.args.university,
              authorized: true
            }));
          
          setUniversities(currentUniversities);
        } catch (error) {
          console.error('Error loading universities:', error);
        }
      }
    };
    
    loadUniversities();
  }, [contracts]);

  // Load pending universities
  useEffect(() => {
    const loadPendingUniversities = async () => {
      if (contracts?.educationCertificate) {
        try {
          const pending = await contracts.educationCertificate.getPendingUniversities();
          setPendingUniversities(pending);
        } catch (error) {
          console.error('Error loading pending universities:', error);
        }
      }
    };
    
    loadPendingUniversities();
  }, [contracts]);

  const handleAuthorizeUniversity = async () => {
    if (!newUniversityAddress || !newUniversityDID) {
      toast({
        title: 'Error',
        description: 'Please enter both address and DID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contracts.educationCertificate.authorizeUniversity(
        newUniversityAddress,
        newUniversityDID,
        { gasLimit: 500000 }
      );
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'University authorized successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setNewUniversityAddress('');
      setNewUniversityDID('');
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to authorize university',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeUniversity = async (universityAddress) => {
    setIsLoading(true);
    try {
      const tx = await contracts.educationCertificate.revokeUniversity(universityAddress);
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'University authorization revoked',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Update universities list
      setUniversities(universities.filter(u => u.address !== universityAddress));
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke university',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUniversity = async (address, did) => {
    setIsLoading(true);
    try {
      const tx = await contracts.educationCertificate.authorizeUniversity(
        address, 
        did,
        { gasLimit: 500000 }
      );
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'University approved successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh lists
      setPendingUniversities(prev => prev.filter(u => u.universityAddress !== address));
      
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve university',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={6}>Admin Dashboard</Heading>
      
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Universities</Tab>
          <Tab>System Stats</Tab>
        </TabList>

        <TabPanels>
          {/* Universities Tab */}
          <TabPanel>
            <Stack spacing={6}>
              {/* Add New University */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Add New University</Heading>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel>University Address</FormLabel>
                      <Input
                        placeholder="0x..."
                        value={newUniversityAddress}
                        onChange={(e) => setNewUniversityAddress(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>University DID</FormLabel>
                      <Input
                        placeholder="did:..."
                        value={newUniversityDID}
                        onChange={(e) => setNewUniversityDID(e.target.value)}
                      />
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      onClick={handleAuthorizeUniversity}
                      isLoading={isLoading}
                    >
                      Authorize University
                    </Button>
                  </Stack>
                </CardBody>
              </Card>

              {/* Universities List */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Authorized Universities</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Address</Th>
                        <Th>Status</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {universities.map((university, index) => (
                        <Tr key={index}>
                          <Td>{university.address}</Td>
                          <Td>
                            <Badge colorScheme="green">
                              Authorized
                            </Badge>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleRevokeUniversity(university.address)}
                              isLoading={isLoading}
                            >
                              Revoke
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  {universities.length === 0 && (
                    <Text textAlign="center" py={4}>
                      No universities found
                    </Text>
                  )}
                </CardBody>
              </Card>

              <Card mb={6}>
                <CardBody>
                  <Heading size="md" mb={4}>Pending Registrations</Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Address</Th>
                        <Th>DID</Th>
                        <Th>Request Time</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pendingUniversities.map((university, index) => (
                        <Tr key={index}>
                          <Td>{university.universityAddress}</Td>
                          <Td>{university.did}</Td>
                          <Td>{new Date(university.requestTime * 1000).toLocaleString()}</Td>
                          <Td>
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleApproveUniversity(
                                university.universityAddress,
                                university.did
                              )}
                              isLoading={isLoading}
                            >
                              Approve
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  {pendingUniversities.length === 0 && (
                    <Text textAlign="center" py={4}>
                      No pending registrations
                    </Text>
                  )}
                </CardBody>
              </Card>
            </Stack>
          </TabPanel>

          {/* System Stats Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={4}>
                  <Text><strong>Contract Address:</strong> {contracts?.educationCertificate?.address}</Text>
                  <Text><strong>Admin Address:</strong> {account}</Text>
                  <Text><strong>Total Universities:</strong> {universities.length}</Text>
                  {/* Add more stats as needed */}
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
}

export default AdminDashboard; 