// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IDID.sol";

// Interface section
interface IEducationCertificate {
    struct CertificateInfo {
        string certificateHash;
        address university;
        uint256 issueDate;
        string certificateType;
        bool isValid;
        string ipfsHash;
    }

    function authorizedUniversities(address university) external view returns (bool);
    function registeredDIDs(string memory did) external view returns (bool);
    function isDIDRegistered(string memory did) external view returns (bool);
    function getCertificateDetails(
        address _student, 
        string calldata _certificateHash
    ) external view returns (
        string memory certificateHash,
        address university,
        uint256 issueDate,
        string memory certificateType,
        bool isValid,
        string memory ipfsHash,
        string memory issuerDID,
        string memory studentDID
    );
}

// Main contract implementing the interface
contract EducationCertificate is IEducationCertificate, ERC721, Ownable {
    // Structs
    struct Certificate {
        string certificateHash;
        address university;
        uint256 issueDate;
        string certificateType;
        bool isValid;
        string ipfsHash;
        mapping(address => bool) authorizedViewers;
        mapping(address => uint256) viewerExpiration;
        string issuerDID;
        string studentDID;
    }

    // Add this struct near the top of the contract, after the Certificate struct
    struct CertificateView {
        string certificateHash;
        address university;
        uint256 issueDate;
        string certificateType;
        bool isValid;
        string ipfsHash;
    }

    // Mappings
    mapping(address => bool) public authorizedUniversities;
    mapping(address => mapping(string => Certificate)) public studentCertificates;
    mapping(address => string[]) public studentCertificateList;
    mapping(address => string) public userDIDs;
    mapping(string => bool) public registeredDIDs;

    // Events
    event UniversityAuthorized(address indexed university);
    event UniversityRevoked(address indexed university);
    event CertificateIssued(
        address indexed student, 
        address indexed university, 
        string certificateHash
    );
    event CertificateRevoked(
        address indexed student, 
        address indexed university, 
        string certificateHash
    );
    event CertificateIPFSUpdated(
        address indexed student,
        string certificateHash,
        string ipfsHash
    );
    event ViewerAuthorized(
        address indexed student,
        address indexed viewer,
        string certificateHash
    );
    event ViewerRevoked(
        address indexed student,
        address indexed viewer,
        string certificateHash
    );
    event ViewerAccessExtended(
        address indexed student,
        address indexed viewer,
        string certificateHash,
        uint256 newExpiration
    );
    event DebugRegisterDID(address sender, string did);
    event UniversityRegistrationRequested(address indexed university, string did);

    // Add this to your contract's state variables
    struct PendingUniversity {
        address universityAddress;
        string did;
        uint256 requestTime;
    }

    PendingUniversity[] public pendingUniversities;
    mapping(address => bool) public isPending;

    constructor() ERC721("EducationCertificate", "EDUCERT") Ownable(msg.sender) {}

    modifier onlyAuthorizedUniversity() {
        require(
            authorizedUniversities[msg.sender],
            "Only authorized universities can call this function"
        );
        _;
    }

    //Grants authorization to a specific university issue certificates
    function authorizeUniversity(
        address _university, 
        string calldata _did
    ) external onlyOwner {
        require(_university != address(0), "Invalid university address");
        require(!authorizedUniversities[_university], "University already authorized");
        require(bytes(_did).length > 0, "Invalid DID");
        
        // Register DID and authorize
        userDIDs[_university] = _did;
        registeredDIDs[_did] = true;
        authorizedUniversities[_university] = true;
        
        // Remove from pending if exists
        if (isPending[_university]) {
            isPending[_university] = false;
            // Remove from pendingUniversities array
            for (uint i = 0; i < pendingUniversities.length; i++) {
                if (pendingUniversities[i].universityAddress == _university) {
                    // Move last element to this position and pop
                    pendingUniversities[i] = pendingUniversities[pendingUniversities.length - 1];
                    pendingUniversities.pop();
                    break;
                }
            }
        }
        
        emit UniversityAuthorized(_university);
    }

    function revokeUniversity(address _university) external onlyOwner {
        require(authorizedUniversities[_university], "University not authorized");
        
        authorizedUniversities[_university] = false;
        emit UniversityRevoked(_university);
    }

    //Grants authorization to a specific user to see the off-chain data of the certificate
    function authorizeViewer(
        string calldata _certificateHash,
        address _viewer,
        uint256 _duration
    ) external {
        Certificate storage cert = studentCertificates[msg.sender][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        require(_viewer != address(0), "Invalid viewer address");
        require(!cert.authorizedViewers[_viewer], "Viewer already authorized");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");
        
        cert.authorizedViewers[_viewer] = true;
        cert.viewerExpiration[_viewer] = block.timestamp + _duration;
        emit ViewerAuthorized(msg.sender, _viewer, _certificateHash);
    }

    function isAuthorizedViewer(
        address _student,
        string calldata _certificateHash,
        address _viewer
    ) external view returns (bool) {
        Certificate storage cert = studentCertificates[_student][_certificateHash];
        
        if (_viewer == _student || _viewer == cert.university) {
            return true;
        }
        
        return cert.authorizedViewers[_viewer] && 
               cert.viewerExpiration[_viewer] >= block.timestamp;
    }

    function issueCertificate(
        address _student,
        string calldata _certificateHash,
        string calldata _certificateType,
        string calldata _ipfsHash,
        string calldata _studentDID
    ) external onlyAuthorizedUniversity {
        require(_student != address(0), "Invalid student address");
        require(bytes(_certificateHash).length > 0, "Invalid certificate hash");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        require(bytes(_studentDID).length > 0, "Invalid student DID");
        
        require(bytes(userDIDs[_student]).length > 0, "Student has not registered a DID");
        require(keccak256(bytes(userDIDs[_student])) == keccak256(bytes(_studentDID)), 
            "Student DID mismatch");
        require(registeredDIDs[_studentDID], "Student DID not registered");

        require(
            !studentCertificates[_student][_certificateHash].isValid,
            "Certificate already exists"
        );

        uint256 tokenId = uint256(keccak256(abi.encodePacked(_student, _certificateHash)));
        _safeMint(_student, tokenId);

        // Create certificate directly in storage instead of memory
        Certificate storage newCertificate = studentCertificates[_student][_certificateHash];
        newCertificate.certificateHash = _certificateHash;
        newCertificate.university = msg.sender;
        newCertificate.issueDate = block.timestamp;
        newCertificate.certificateType = _certificateType;
        newCertificate.isValid = true;
        newCertificate.ipfsHash = _ipfsHash;
        newCertificate.issuerDID = userDIDs[msg.sender];
        newCertificate.studentDID = _studentDID;

        studentCertificateList[_student].push(_certificateHash);

        emit CertificateIssued(_student, msg.sender, _certificateHash);
        emit CertificateIPFSUpdated(_student, _certificateHash, _ipfsHash);
    }

    function revokeCertificate(
        address _student,
        string calldata _certificateHash
    ) external onlyAuthorizedUniversity {
        Certificate storage certificate = studentCertificates[_student][_certificateHash];
        require(certificate.isValid, "Certificate doesn't exist or is already revoked");
        require(
            certificate.university == msg.sender,
            "Only issuing university can revoke"
        );
        certificate.isValid = false;
        emit CertificateRevoked(_student, msg.sender, _certificateHash);
    }

    function getStudentCertificates(
        address _student
    ) external view returns (string[] memory) {
        return studentCertificateList[_student];
    }

    function getCertificateDetails(
        address _student,
        string calldata _certificateHash
    ) external view returns (
        string memory certificateHash,
        address university,
        uint256 issueDate,
        string memory certificateType,
        bool isValid,
        string memory ipfsHash,
        string memory issuerDID,
        string memory studentDID
    ) {
        Certificate storage cert = studentCertificates[_student][_certificateHash];
        
        // Add access control for ipfsHash
        string memory accessibleIpfsHash = "";
        if (msg.sender == _student || 
            msg.sender == cert.university || 
            (cert.authorizedViewers[msg.sender] && cert.viewerExpiration[msg.sender] >= block.timestamp)) {
            accessibleIpfsHash = cert.ipfsHash;
        }
        
        return (
            cert.certificateHash,
            cert.university,
            cert.issueDate,
            cert.certificateType,
            cert.isValid,
            accessibleIpfsHash,
            cert.issuerDID,
            cert.studentDID
        );
    }

    function getMyAllCertificates() external view returns (CertificateView[] memory) {
        string[] memory certificateHashes = studentCertificateList[msg.sender];
        CertificateView[] memory certificates = new CertificateView[](certificateHashes.length);
        
        for (uint i = 0; i < certificateHashes.length; i++) {
            Certificate storage cert = studentCertificates[msg.sender][certificateHashes[i]];
            certificates[i] = CertificateView({
                certificateHash: cert.certificateHash,
                university: cert.university,
                issueDate: cert.issueDate,
                certificateType: cert.certificateType,
                isValid: cert.isValid,
                ipfsHash: cert.ipfsHash
            });
        }
        
        return certificates;
    }

    function updateCertificateIPFS(
        address _student,
        string calldata _certificateHash,
        string calldata _ipfsHash
    ) external onlyAuthorizedUniversity {
        Certificate storage certificate = studentCertificates[_student][_certificateHash];
        
        require(certificate.isValid, "Certificate doesn't exist or is revoked");
        require(certificate.university == msg.sender, "Only issuing university can update");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");

        certificate.ipfsHash = _ipfsHash;
        emit CertificateIPFSUpdated(_student, _certificateHash, _ipfsHash);
    }

    // Add this function to revoke viewer access
    function revokeViewer(
        string calldata _certificateHash,
        address _viewer
    ) external {
        Certificate storage cert = studentCertificates[msg.sender][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(bytes(cert.certificateHash).length > 0, "Certificate does not exist");
        require(_viewer != address(0), "Invalid viewer address");
        require(cert.authorizedViewers[_viewer], "Viewer not authorized");
        
        cert.authorizedViewers[_viewer] = false;
        emit ViewerRevoked(msg.sender, _viewer, _certificateHash);
    }

    // Add a function to extend viewer access
    function extendViewerAccess(
        string calldata _certificateHash,
        address _viewer,
        uint256 _additionalDuration
    ) external {
        Certificate storage cert = studentCertificates[msg.sender][_certificateHash];
        require(cert.isValid, "Certificate doesn't exist or is revoked");
        require(cert.authorizedViewers[_viewer], "Viewer not authorized");
        require(_additionalDuration > 0 && _additionalDuration <= 365 days, "Invalid duration");

        cert.viewerExpiration[_viewer] = block.timestamp + _additionalDuration;
        emit ViewerAccessExtended(msg.sender, _viewer, _certificateHash, cert.viewerExpiration[_viewer]);
    }

    // Add DID registration function
    function registerDID(string calldata _did) external {
        require(bytes(_did).length > 0, "Invalid DID: Empty string");
        require(
            bytes(userDIDs[msg.sender]).length == 0, 
            "DID already registered for this address"
        );
        require(
            !registeredDIDs[_did], 
            "This DID is already registered to another address"
        );
        
        // Add debug event
        emit DebugRegisterDID(msg.sender, _did);
        
        userDIDs[msg.sender] = _did;
        registeredDIDs[_did] = true;
    }

    // Add this function to implement the missing interface method
    function isDIDRegistered(string memory did) external view returns (bool) {
        return registeredDIDs[did];
    }

    // Add this function to check registration status
    function checkRegistrationStatus(address _address, string calldata _did) 
        external 
        view 
        returns (
            bool hasExistingDID,
            bool isDIDRegistered,
            string memory currentDID
        ) 
    {
        hasExistingDID = bytes(userDIDs[_address]).length > 0;
        isDIDRegistered = registeredDIDs[_did];
        currentDID = userDIDs[_address];
        return (hasExistingDID, isDIDRegistered, currentDID);
    }

    // Add this function for universities to request registration
    function requestUniversityRegistration(string calldata _did) external {
        require(!authorizedUniversities[msg.sender], "Already authorized");
        require(!isPending[msg.sender], "Registration already pending");
        require(bytes(_did).length > 0, "Invalid DID");
        
        pendingUniversities.push(PendingUniversity({
            universityAddress: msg.sender,
            did: _did,
            requestTime: block.timestamp
        }));
        isPending[msg.sender] = true;
        
        emit UniversityRegistrationRequested(msg.sender, _did);
    }

    // Add this function to get all pending universities
    function getPendingUniversities() external view returns (PendingUniversity[] memory) {
        return pendingUniversities;
    }
} 