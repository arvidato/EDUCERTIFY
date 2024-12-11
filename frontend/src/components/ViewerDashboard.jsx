import { useState } from 'react';
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
} from '@chakra-ui/react';

function ViewerDashboard({ contracts, account, certificates }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [did, setDid] = useState('');
  const [registrationType, setRegistrationType] = useState('student');
  const [isRegistering, setIsRegistering] = useState(false);
  const toast = useToast();

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

  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={6}>Viewer Dashboard</Heading>
      
      <Tabs onChange={(index) => setSelectedTab(index)} colorScheme="blue">
        <TabList>
          <Tab>My Certificates</Tab>
          <Tab>Verify Certificate</Tab>
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
                      <Button size="sm" colorScheme="blue">
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

          {/* Verify Certificate Tab */}
          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>Verify a Certificate</Heading>
              {/* Add certificate verification form here */}
              <Text>Certificate verification feature coming soon...</Text>
            </Box>
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
    </Container>
  );
}

export default ViewerDashboard; 