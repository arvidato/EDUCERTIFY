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
        string issuerDID;
        string studentDID;
    }
    
    mapping(address => mapping(uint256 => VerificationRequest)) public verificationRequests;
    mapping(address => uint256) public employerRequestCount;
    
    event VerificationStatus(
        address indexed employer,
        address indexed student,
        string certificateHash,
        uint8 status,
        string reason,
        uint256 requestId
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
            issuerDID: "",
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
            string memory,
            address university,
            uint256 issueDate,
            string memory,
            bool isValid,
            string memory,
            string memory issuerDID,
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
            
            if (!certificateContract.isDIDRegistered(issuerDID) || 
                !certificateContract.isDIDRegistered(studentDID)) {
                emit VerificationStatus(
                    msg.sender,
                    request.student,
                    request.certificateHash,
                    2,
                    "Invalid DIDs",
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
            request.issuerDID = issuerDID;
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
        string memory issuerDID,
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
            request.issuerDID,
            request.studentDID
        );
    }
    
    function getEmployerVerificationCount() external view returns (uint256) {
        return employerRequestCount[msg.sender];
    }
} 