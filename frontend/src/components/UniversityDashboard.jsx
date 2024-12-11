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
  FormControl,
  FormLabel,
  Input,
  useToast,
  Divider,
  Textarea,
} from '@chakra-ui/react';

function UniversityDashboard({ contracts, account }) {
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [studentAddress, setStudentAddress] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [gpa, setGpa] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');
  const [issuingTo, setIssuingTo] = useState('');
  const [certificateHash, setCertificateHash] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [studentDID, setStudentDID] = useState('');
  const [studentName, setStudentName] = useState('');
  const [courseType, setCourseType] = useState('');
  const [overallGrade, setOverallGrade] = useState('');
  const [issuanceDate, setIssuanceDate] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const toast = useToast();

  // Add useEffect to check if university is authorized
  useEffect(() => {
    const checkAuthorization = async () => {
      if (contracts?.educationCertificate && account) {
        try {
          const isAuth = await contracts.educationCertificate.authorizedUniversities(account);
          setIsAuthorized(isAuth);
        } catch (error) {
          console.error('Error checking authorization:', error);
        }
      }
    };

    checkAuthorization();
  }, [contracts, account]);

  const handleGenerateHash = async () => {
    if (!studentName || !studentAddress || !studentId || !courseType || !courseName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Create the certificate data
      const certificateData = {
        studentName,
        studentAddress,
        studentId,
        courseType,
        courseName,
        overallGrade: overallGrade || 'N/A',
        additionalInfo: additionalInfo || '',
        issuanceDate: Math.floor(Date.now() / 1000),
        schoolName: account
      };

      // Generate hash using the helper contract
      const hash = await contracts.certificateHelper.generateCertificateHash(
        studentId,
        courseName,
        certificateData.issuanceDate
      );
      setGeneratedHash(hash);

      // Store the certificate data in IPFS (mock for now)
      const mockIpfsHash = "QmXyz..."; // You'll need to implement actual IPFS storage
      setIpfsHash(mockIpfsHash);

      toast({
        title: 'Success',
        description: 'Certificate hash generated successfully. Proceed to Issue Certificate tab.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Store the data for the Issue Certificate tab
      localStorage.setItem('certificateData', JSON.stringify({
        hash,
        ipfsHash: mockIpfsHash,
        courseName,
        studentAddress,
        studentDID: `did:eth:${studentAddress}`,
        issuanceDate: certificateData.issuanceDate,
        schoolName: account
      }));

    } catch (error) {
      console.error('Error generating hash:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate certificate hash',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleIssueCertificate = async () => {
    if (!studentAddress || !generatedHash || !certificateType) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields and generate a hash first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIssuingCertificate(true);
    try {
      // Create student data object
      const studentData = {
        studentName: studentId, // You might want to add a separate field for student name
        studentId: studentId,
        courses: [{
          name: courseName,
          grade: "N/A", // Add grade field if needed
          completionDate: Math.floor(Date.now() / 1000),
          credits: "N/A" // Add credits field if needed
        }],
        gpa: gpa || "N/A",
        additionalInfo: additionalInfo || "",
        did: `did:eth:${studentAddress}`
      };

      // Generate JSON data
      const jsonData = await contracts.certificateHelper.createStudentDataJSON(studentData);
      
      // Issue certificate (you'll need to implement this in your smart contract)
      const tx = await contracts.educationCertificate.issueCertificate(
        studentAddress,
        generatedHash,
        certificateType,
        jsonData,
        `did:eth:${studentAddress}`
      );
      
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Certificate issued successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setStudentAddress('');
      setStudentId('');
      setCourseName('');
      setCertificateType('');
      setGpa('');
      setAdditionalInfo('');
      setGeneratedHash('');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue certificate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIssuingCertificate(false);
    }
  };

  const handleIssueCertificateDirectly = async () => {
    if (!isAuthorized) {
      toast({
        title: 'Error',
        description: 'This account is not authorized as a university',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!issuingTo || !certificateHash || !certificateType || !ipfsHash || !studentDID) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIssuingCertificate(true);
    try {
      const tx = await contracts.educationCertificate.issueCertificate(
        issuingTo,
        certificateHash,
        certificateType,
        ipfsHash,
        studentDID,
        { gasLimit: 500000 } // Add explicit gas limit
      );
      
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Certificate issued successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setIssuingTo('');
      setCertificateHash('');
      setCertificateType('');
      setIpfsHash('');
      setStudentDID('');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue certificate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIssuingCertificate(false);
    }
  };

  // Add useEffect to load saved certificate data
  useEffect(() => {
    const savedData = localStorage.getItem('certificateData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCertificateHash(data.hash);
      setIpfsHash(data.ipfsHash);
      setIssuingTo(data.studentAddress);
      setStudentDID(data.studentDID);
      setIssuanceDate(data.issuanceDate);
    }
  }, []);

  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={6}>University Dashboard</Heading>
      
      {!isAuthorized && (
        <Box mb={6} p={4} bg="red.100" borderRadius="md">
          <Text color="red.600">
            Warning: This account is not authorized as a university. Please contact the admin to get authorized.
          </Text>
        </Box>
      )}
      
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Generate Certificate Hash</Tab>
          <Tab>Issue Certificate</Tab>
          <Tab>Issued Certificates</Tab>
          <Tab>University Profile</Tab>
        </TabList>

        <TabPanels>
          {/* Generate Certificate Hash Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={4}>
                  <Heading size="md">Generate Certificate Hash</Heading>
                  <Text color="gray.600" mb={2}>
                    Step 1: Fill in the certificate details to generate a unique hash
                  </Text>

                  <FormControl isRequired>
                    <FormLabel>Student Name</FormLabel>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter student's full name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Student Address</FormLabel>
                    <Input
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Student ID</FormLabel>
                    <Input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Enter student ID"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Course Type</FormLabel>
                    <Input
                      value={courseType}
                      onChange={(e) => setCourseType(e.target.value)}
                      placeholder="e.g., Undergraduate, Graduate"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Course Name</FormLabel>
                    <Input
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Enter course name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Overall Grade</FormLabel>
                    <Input
                      value={overallGrade}
                      onChange={(e) => setOverallGrade(e.target.value)}
                      placeholder="e.g., A, B+"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Additional Information</FormLabel>
                    <Textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Enter any additional information"
                    />
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    onClick={handleGenerateHash}
                    isDisabled={!studentName || !studentAddress || !studentId || !courseType || !courseName}
                  >
                    Generate Certificate Hash
                  </Button>

                  {generatedHash && (
                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Text><strong>Generated Hash:</strong></Text>
                      <Text fontSize="sm" wordBreak="break-all">{generatedHash}</Text>
                      <Text mt={2} color="blue.600">
                        Proceed to the "Issue Certificate" tab to complete the process
                      </Text>
                    </Box>
                  )}
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Issue Certificate Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={4}>
                  <Heading size="md">Issue Certificate</Heading>
                  <Text color="gray.600" mb={2}>
                    Step 2: Review and issue the certificate. You can either use the data from Step 1 or enter new data.
                  </Text>

                  {/* Show data from Step 1 if available */}
                  {certificateHash && (
                    <Box p={4} bg="blue.50" borderRadius="md" mb={4}>
                      <Heading size="sm" mb={2}>Data from Step 1:</Heading>
                      <Stack spacing={2}>
                        <Text><strong>Certificate Hash:</strong> {certificateHash}</Text>
                        <Text><strong>School Name:</strong> {account}</Text>
                        <Text><strong>Course Name:</strong> {courseName}</Text>
                        <Text><strong>Student Address:</strong> {issuingTo}</Text>
                      </Stack>
                    </Box>
                  )}

                  <Divider />

                  {/* Manual Input Form */}
                  <FormControl isRequired>
                    <FormLabel>Certificate Hash</FormLabel>
                    <Input
                      value={certificateHash}
                      onChange={(e) => setCertificateHash(e.target.value)}
                      placeholder="Enter certificate hash"
                    />
                    <Text fontSize="sm" color="gray.500">Use the hash from Step 1 or enter a new one</Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Student Address</FormLabel>
                    <Input
                      value={issuingTo}
                      onChange={(e) => setIssuingTo(e.target.value)}
                      placeholder="0x..."
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Course Name</FormLabel>
                    <Input
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Enter course name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Certificate Type</FormLabel>
                    <Input
                      value={certificateType}
                      onChange={(e) => setCertificateType(e.target.value)}
                      placeholder="e.g., Bachelor's Degree, Master's Degree"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>IPFS Hash</FormLabel>
                    <Input
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      placeholder="Enter IPFS hash"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Student DID</FormLabel>
                    <Input
                      value={studentDID}
                      onChange={(e) => setStudentDID(e.target.value)}
                      placeholder="did:eth:..."
                    />
                    <Text fontSize="sm" color="gray.500">
                      Format: did:eth:studentAddress
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Issuance Date</FormLabel>
                    <Input
                      type="date"
                      value={issuanceDate ? new Date(issuanceDate * 1000).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        setIssuanceDate(Math.floor(date.getTime() / 1000));
                      }}
                    />
                  </FormControl>

                  {/* Preview Section */}
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Heading size="sm" mb={3}>Certificate Preview</Heading>
                    <Stack spacing={2}>
                      <Text><strong>Certificate Hash:</strong> {certificateHash}</Text>
                      <Text><strong>School Name:</strong> {account}</Text>
                      <Text><strong>Course Name:</strong> {courseName}</Text>
                      <Text><strong>Certificate Type:</strong> {certificateType}</Text>
                      <Text><strong>Student Address:</strong> {issuingTo}</Text>
                      <Text><strong>Student DID:</strong> {studentDID}</Text>
                      <Text><strong>IPFS Hash:</strong> {ipfsHash}</Text>
                      <Text><strong>Issuance Date:</strong> {
                        issuanceDate ? new Date(issuanceDate * 1000).toLocaleDateString() : 'Not set'
                      }</Text>
                    </Stack>
                  </Box>

                  <Button
                    colorScheme="green"
                    onClick={handleIssueCertificateDirectly}
                    isLoading={issuingCertificate}
                    isDisabled={!certificateHash || !issuingTo || !certificateType || !ipfsHash || !studentDID}
                    loadingText="Issuing Certificate..."
                  >
                    Issue Certificate
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Other tabs remain the same */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Issued Certificates</Heading>
                <Text>View and manage certificates issued by your university.</Text>
                {/* Add list of issued certificates here */}
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Stack spacing={4}>
                  <Heading size="md">University Profile</Heading>
                  <Text><strong>Address:</strong> {account}</Text>
                  <Divider />
                  <Text><strong>DID:</strong> did:eth:{account}</Text>
                  <Text><strong>Status:</strong> Authorized</Text>
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
}

export default UniversityDashboard; 