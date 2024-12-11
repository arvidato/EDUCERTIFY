// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EducationCertificate.sol";
import "./IDID.sol";

contract CertificateVerifier {
    IEducationCertificate public certificateContract;
    
    struct VerificationRequest {
        address student;
        string certificateHash;
        bool isVerified;
        uint256 timestamp;
        address issuingUniversity;
        uint256 issueDate;
        string studentDID;
    }
    
    struct SharedCertificate {
        string certificateHash;
        uint256 expiryTime;
        bool isActive;
    }
    
    mapping(address => mapping(uint256 => VerificationRequest)) public verificationRequests;
    mapping(address => uint256) public employerRequestCount;
    mapping(address => mapping(address => SharedCertificate)) public sharedCertificates;
    mapping(address => address[]) public authorizedViewers;
    
    event VerificationStatus(
        address indexed employer,
        address indexed student,
        string certificateHash,
        uint8 status,
        string reason,
        uint256 requestId
    );
    
    event CertificateShared(
        address indexed student,
        address indexed viewer,
        string certificateHash,
        uint256 expiryTime
    );
    
    event CertificateShareRevoked(
        address indexed student,
        address indexed viewer,
        string certificateHash
    );
    
    constructor(address _certificateContract) {
        require(_certificateContract != address(0), "Invalid certificate contract address");
        certificateContract = IEducationCertificate(_certificateContract);
    }
    
    function requestVerification(
        address _student,
        string calldata _certificateHash
    ) external returns (uint256 requestId) {
        require(_student != address(0), "Invalid student address");
        require(bytes(_certificateHash).length > 0, "Invalid certificate hash");
        
        requestId = employerRequestCount[msg.sender]++;
        
        VerificationRequest memory newRequest = VerificationRequest({
            student: _student,
            certificateHash: _certificateHash,
            isVerified: false,
            timestamp: block.timestamp,
            issuingUniversity: address(0),
            issueDate: 0,
            studentDID: ""
        });
        
        verificationRequests[msg.sender][requestId] = newRequest;
        
        emit VerificationStatus(
            msg.sender,
            _student,
            _certificateHash,
            0,
            "",
            requestId
        );
        
        _verifyCertificate(requestId);
        
        return requestId;
    }
    
    function _verifyCertificate(uint256 _requestId) internal {
        VerificationRequest storage request = verificationRequests[msg.sender][_requestId];
        
        try certificateContract.getCertificateDetails(
            request.student,
            request.certificateHash
        ) returns (
            string memory certificateHash,
            address university,
            uint256 issueDate,
            string memory certificateType,
            bool isValid,
            string memory ipfsHash,
            string memory studentDID
        ) {
            if (!certificateContract.authorizedUniversities(university)) {
                emit VerificationStatus(
                    msg.sender,
                    request.student,
                    request.certificateHash,
                    2,
                    "University not authorized",
                    _requestId
                );
                return;
            }
            
            if (!certificateContract.isDIDRegistered(studentDID)) {
                emit VerificationStatus(
                    msg.sender,
                    request.student,
                    request.certificateHash,
                    2,
                    "Invalid DID",
                    _requestId
                );
                return;
            }
            
            if (!isValid) {
                emit VerificationStatus(
                    msg.sender,
                    request.student,
                    request.certificateHash,
                    2,
                    "Certificate is not valid or has been revoked",
                    _requestId
                );
                return;
            }
            
            request.isVerified = true;
            request.issuingUniversity = university;
            request.issueDate = issueDate;
            request.studentDID = studentDID;
            
            emit VerificationStatus(
                msg.sender,
                request.student,
                request.certificateHash,
                1,
                "Certificate is valid",
                _requestId
            );
            
        } catch {
            emit VerificationStatus(
                msg.sender,
                request.student,
                request.certificateHash,
                2,
                "Certificate does not exist",
                _requestId
            );
        }
    }
    
    function getVerificationDetails(
        uint256 _requestId
    ) external view returns (
        address student,
        string memory certificateHash,
        bool isVerified,
        bool exists,
        address issuingUniversity,
        uint256 issueDate,
        bool isUniversityAuthorized,
        string memory studentDID
    ) {
        VerificationRequest memory request = verificationRequests[msg.sender][_requestId];
        require(request.timestamp != 0, "Verification request does not exist");
        
        bool universityAuthorized = false;
        if (request.issuingUniversity != address(0)) {
            universityAuthorized = certificateContract.authorizedUniversities(request.issuingUniversity);
        }
        
        return (
            request.student,
            request.certificateHash,
            request.isVerified,
            request.timestamp != 0,
            request.issuingUniversity,
            request.issueDate,
            universityAuthorized,
            request.studentDID
        );
    }
    
    function getEmployerVerificationCount() external view returns (uint256) {
        return employerRequestCount[msg.sender];
    }
    
    function shareCertificate(
        address _viewer,
        string calldata _certificateHash,
        uint256 _duration
    ) external {
        require(_viewer != address(0), "Invalid viewer address");
        require(bytes(_certificateHash).length > 0, "Invalid certificate hash");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 expiryTime = block.timestamp + _duration;
        
        SharedCertificate memory shared = SharedCertificate({
            certificateHash: _certificateHash,
            expiryTime: expiryTime,
            isActive: true
        });
        
        sharedCertificates[msg.sender][_viewer] = shared;
        authorizedViewers[msg.sender].push(_viewer);
        
        emit CertificateShared(msg.sender, _viewer, _certificateHash, expiryTime);
    }
    
    function revokeCertificateAccess(address _viewer) external {
        require(sharedCertificates[msg.sender][_viewer].isActive, "No active sharing found");
        
        sharedCertificates[msg.sender][_viewer].isActive = false;
        
        emit CertificateShareRevoked(
            msg.sender,
            _viewer,
            sharedCertificates[msg.sender][_viewer].certificateHash
        );
    }
    
    function getSharedCertificateDetails(
        address _student,
        address _viewer
    ) external view returns (
        string memory certificateHash,
        uint256 expiryTime,
        bool isActive,
        bool isValid
    ) {
        SharedCertificate memory shared = sharedCertificates[_student][_viewer];
        bool valid = shared.isActive && shared.expiryTime > block.timestamp;
        
        return (
            shared.certificateHash,
            shared.expiryTime,
            shared.isActive,
            valid
        );
    }
    
    function getAuthorizedViewers(
        address _student
    ) external view returns (address[] memory) {
        return authorizedViewers[_student];
    }
} 