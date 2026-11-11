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
import { ethers } from 'ethers';
import axios from 'axios';

function UniversityDashboard({ contracts, account }) {
  const [ipfsNFTHash, setIpfsNFTHash] = useState('');
  const [ipfsGradesHash, setIpfsGradesHash] = useState('');
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
  const [certificateData, setCertificateData] = useState(null);

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
      // Create the certificate NFT data
      const certificateNFTData = {
        studentName,
        studentAddress,
        studentId,
        courseType,
        courseName,
        issuanceDate: Math.floor(Date.now() / 1000),
        schoolName: account,
        universityAddress: account,
        timestamp: new Date().toISOString(),
        studentDID: `did:eth:${studentAddress}`
      };

      // Create separate grades data
      const gradesData = {
        studentId,
        studentName,
        studentAddress,
        courseType,
        courseName,
        overallGrade: overallGrade || 'N/A',
        additionalInfo: additionalInfo || '',
        timestamp: new Date().toISOString(),
        universityAddress: account
      };

      // Generate hash using the helper contract
      const hash = await contracts.certificateHelper.generateCertificateHash(
        studentId,
        courseName,
        certificateNFTData.issuanceDate
      );
      setGeneratedHash(hash);

      // Upload both JSONs to Pinata
      try {
        // Upload certificate NFT data
        const nftHash = await uploadToPinata(certificateNFTData, hash, 'nft');
        setIpfsNFTHash(nftHash);
        
        // Upload grades data
        const gradesHash = await uploadToPinata(gradesData, hash, 'grades');
        setIpfsGradesHash(gradesHash);

        // Set the regular ipfsHash to the NFT hash for backward compatibility
        setIpfsHash(nftHash);

        toast({
          title: 'Success',
          description: 'Certificate and grades data uploaded to IPFS successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Store complete data
        const completeData = {
          ...certificateNFTData,
          grades: gradesData,
          ipfsNFTHash: nftHash,
          ipfsGradesHash: gradesHash,
          certificateHash: hash
        };

        // Store in localStorage
        localStorage.setItem(hash, JSON.stringify(completeData));
        setCertificateData(completeData);
        setCertificateHash(hash);

      } catch (pinataError) {
        console.error('Pinata upload error:', pinataError);
        toast({
          title: 'Warning',
          description: 'Failed to upload to IPFS, but continuing with hash generation',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }

      toast({
        title: 'Success',
        description: 'Certificate hash generated successfully. Proceed to Issue Certificate tab.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

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

  // Update the uploadToPinata function to handle different types of data
  const uploadToPinata = async (data, hash, type) => {
    const savedCredentials = localStorage.getItem(`pinata_credentials_${account}`);
    if (!savedCredentials) {
      throw new Error('Please set up your Pinata credentials in the University Profile tab');
    }

    const { jwt } = JSON.parse(savedCredentials);
    
    try {
      const JSONBody = JSON.stringify(data);
      const formData = new FormData();
      const blob = new Blob([JSONBody], { type: 'application/json' });
      
      // Create filename using hash, type and DID
      const filename = `${hash}_${type}_${data.studentDID || 'did:eth:' + data.studentAddress}.json`;
      formData.append('file', blob, filename);

      // Add metadata
      const pinataMetadata = JSON.stringify({
        name: filename,
        keyvalues: {
          studentDID: data.studentDID || 'did:eth:' + data.studentAddress,
          certificateHash: hash,
          type: type,
          universityAddress: account,
          timestamp: data.timestamp
        }
      });

      formData.append('pinataMetadata', pinataMetadata);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
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
      const tx = await contracts.educationCertificate.issueCertificate(
        studentAddress,
        certificateHash,
        certificateType,
        ipfsHash,
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
    console.log("Current account:", account);
    try {
      const isAuth = await contracts.educationCertificate.authorizedUniversities(account);
      console.log("Is university authorized:", isAuth);
    } catch (error) {
      console.error("Error checking authorization:", error);
    }

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

  const issueCertificate = async (studentAddress, certificateHash) => {
    try {
      setIssuingCertificate(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.issueCertificate(studentAddress, certificateHash);
      await tx.wait();
      
      toast.success('Certificate issued successfully!');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Failed to issue certificate');
    } finally {
      setIssuingCertificate(false);
    }
  };

  const generateCertificateHash = async (e) => {
    e.preventDefault();
    try {
      setGeneratingHash(true);
      
      // Create the certificate data object
      const certData = {
        studentName,
        studentId,
        courseName,
        courseType,
        overallGrade: overallGrade || 'N/A',
        completionDate: Math.floor(Date.now() / 1000),
        additionalInfo: additionalInfo || '',
        studentAddress,
        universityAddress: account,
        timestamp: new Date().toISOString()
      };
      
      // Generate hash
      const certificateHash = ethers.utils.id(JSON.stringify(certData));
      
      // Upload to Pinata
      try {
        const ipfsHash = await uploadToPinata(certData);
        setIpfsHash(ipfsHash);
        toast.success('Certificate data uploaded to IPFS successfully!');
        
        // Store the IPFS hash along with the certificate data
        certData.ipfsHash = ipfsHash;
      } catch (pinataError) {
        toast.warning('Failed to upload to IPFS, but continuing with hash generation');
      }
      
      // Store the certificate data in localStorage
      localStorage.setItem(certificateHash, JSON.stringify(certData));
      
      setCertificateHash(certificateHash);
      setCertificateData(certData);
      
      // Add option to issue certificate immediately
      if (window.confirm('Would you like to issue this certificate now?')) {
        await issueCertificate(studentAddress, certificateHash);
      }
      
      toast.success('Certificate hash generated successfully!');
    } catch (error) {
      console.error('Error generating hash:', error);
      toast.error('Failed to generate certificate hash');
    } finally {
      setGeneratingHash(false);
    }
  };

  // Add this new function to decode/retrieve certificate data
  const decodeCertificateHash = (hash) => {
    try {
      const storedData = localStorage.getItem(hash);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return null;
    } catch (error) {
      console.error('Error decoding certificate hash:', error);
      return null;
    }
  };

  const requestAuthorization = async () => {
    try {
      const did = `did:eth:${account}`;
      const tx = await contracts.educationCertificate.requestUniversityRegistration(did);
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'Authorization requested successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error requesting authorization:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to request authorization',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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

                  {certificateHash && (
                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Text><strong>Generated Hash:</strong></Text>
                      <Text fontSize="sm" wordBreak="break-all">{certificateHash}</Text>
                      
                      {ipfsHash && (
                        <Box mt={2}>
                          <Text><strong>IPFS Hash:</strong></Text>
                          <Text fontSize="sm" wordBreak="break-all">{ipfsHash}</Text>
                        </Box>
                      )}
                      
                      {/* Add this section to show decoded data */}
                      <Box mt={4}>
                        <Text><strong>Certificate Data:</strong></Text>
                        {certificateData && (
                          <Stack spacing={2} mt={2}>
                            <Text>Student Name: {certificateData.studentName}</Text>
                            <Text>Student ID: {certificateData.studentId}</Text>
                            <Text>Course Name: {certificateData.courseName}</Text>
                            <Text>Course Type: {certificateData.courseType}</Text>
                            <Text>Grade: {certificateData.overallGrade}</Text>
                            <Text>Completion Date: {new Date(certificateData.completionDate * 1000).toLocaleDateString()}</Text>
                            {certificateData.additionalInfo && (
                              <Text>Additional Info: {certificateData.additionalInfo}</Text>
                            )}
                          </Stack>
                        )}
                      </Box>
                      
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
                    <FormLabel>IPFS NFT Hash</FormLabel>
                    <Input
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      placeholder="Upload your NFT image/metadata to IPFS and enter the hash"
                    />
                    <Text fontSize="sm" color="gray.500">
                      This is for the NFT image or metadata. Upload manually.
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>IPFS Certificate Hash</FormLabel>
                    <Input
                      value={ipfsNFTHash}
                      onChange={(e) => setIpfsNFTHash(e.target.value)}
                      placeholder="Upload your certificate data to IPFS and enter the hash"
                    />
                    <Text fontSize="sm" color="gray.500">
                      Auto-filled from previous step, or upload manually
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>IPFS Grades Hash</FormLabel>
                    <Input
                      value={ipfsGradesHash}
                      onChange={(e) => setIpfsGradesHash(e.target.value)}
                      placeholder="Upload your grades data to IPFS and enter the hash"
                    />
                    <Text fontSize="sm" color="gray.500">
                      Auto-filled from previous step, or upload manually
                    </Text>
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
                      <Text><strong>IPFS NFT Hash:</strong> {ipfsHash || 'Not set'}</Text>
                      <Text><strong>IPFS Certificate Hash:</strong> {ipfsNFTHash || 'Not set'}</Text>
                      <Text><strong>IPFS Grades Hash:</strong> {ipfsGradesHash || 'Not set'}</Text>
                      <Text><strong>Issuance Date:</strong> {
                        issuanceDate ? new Date(issuanceDate * 1000).toLocaleDateString() : 'Not set'
                      }</Text>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={4} mt={2}>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, '_blank')}
                      isDisabled={!ipfsHash}
                    >
                      Preview NFT
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${ipfsNFTHash}`, '_blank')}
                      isDisabled={!ipfsNFTHash}
                    >
                      Preview Certificate Data
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${ipfsGradesHash}`, '_blank')}
                      isDisabled={!ipfsGradesHash}
                    >
                      Preview Grades Data
                    </Button>
                  </Stack>

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
                  <Text><strong>DID:</strong> did:eth:{account}</Text>
                  <Text><strong>Status:</strong> {isAuthorized ? 'Authorized' : 'Not Authorized'}</Text>
                  
                  {!isAuthorized && (
                    <Button
                      colorScheme="blue"
                      onClick={requestAuthorization}
                    >
                      Request Authorization
                    </Button>
                  )}
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