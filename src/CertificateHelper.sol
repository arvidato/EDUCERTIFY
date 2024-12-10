// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EducationCertificate.sol";

contract CertificateHelper {
    IEducationCertificate public certificateContract;
    
    constructor(address _certificateContract) {
        certificateContract = IEducationCertificate(_certificateContract);
    }
    
    struct StudentData {
        string studentName;
        string studentId;
        Course[] courses;
        string gpa;
        string additionalInfo;
        string did;
    }
    
    struct Course {
        string name;
        string grade;
        uint256 completionDate;
        string credits;
    }
    
    // Helper function to generate certificate hash
    function generateCertificateHash(
        string memory studentId,
        string memory course,
        uint256 timestamp
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                studentId,
                "-",
                course,
                "-",
                toString(timestamp)
            )
        );
    }
    
    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Consolidated JSON creation function
    function createStudentDataJSON(
        StudentData memory _data
    ) public pure returns (bytes memory) {
        return abi.encodePacked(
            '{',
            _createJSONPair("studentDetails", _createStudentDetailsObject(_data)), ',',
            _createJSONPair("academicRecords", _createAcademicRecordsObject(_data)),
            '}'
        );
    }
    
    // Generic JSON pair creator
    function _createJSONPair(
        string memory key,
        string memory value
    ) internal pure returns (string memory) {
        return string(abi.encodePacked('"', key, '":', value));
    }
    
    // Simplified student details object creator
    function _createStudentDetailsObject(
        StudentData memory _data
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{',
            _createJSONPair("name", _wrapString(_data.studentName)), ',',
            _createJSONPair("studentId", _wrapString(_data.studentId)), ',',
            _createJSONPair("gpa", _wrapString(_data.gpa)), ',',
            _createJSONPair("additionalInfo", _wrapString(_data.additionalInfo)), ',',
            _createJSONPair("did", _wrapString(_data.did)),
            '}'
        ));
    }
    
    // Simplified academic records object creator
    function _createAcademicRecordsObject(
        StudentData memory _data
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{',
            _createJSONPair("courses", _createCoursesArray(_data.courses)),
            '}'
        ));
    }
    
    // Helper to wrap strings in quotes
    function _wrapString(
        string memory value
    ) internal pure returns (string memory) {
        return string(abi.encodePacked('"', value, '"'));
    }
    
    // Simplified courses array creator
    function _createCoursesArray(
        Course[] memory _courses
    ) internal pure returns (string memory) {
        string memory coursesJSON = "[";
        for(uint i = 0; i < _courses.length; i++) {
            if(i > 0) coursesJSON = string(abi.encodePacked(coursesJSON, ","));
            coursesJSON = string(
                abi.encodePacked(
                    coursesJSON,
                    '{',
                    _createJSONPair("name", _wrapString(_courses[i].name)), ',',
                    _createJSONPair("grade", _wrapString(_courses[i].grade)), ',',
                    _createJSONPair("completionDate", _wrapString(toString(_courses[i].completionDate))), ',',
                    _createJSONPair("credits", _wrapString(_courses[i].credits)),
                    '}'
                )
            );
        }
        return string(abi.encodePacked(coursesJSON, "]"));
    }
} 