// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EducationCertificate.sol";
import "../src/CertificateHelper.sol";
import "../src/CertificateVerifier.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // 1. Deploy main EducationCertificate contract first
        EducationCertificate educationCertificate = new EducationCertificate();

        // 2. Deploy CertificateHelper with EducationCertificate address
        CertificateHelper certificateHelper = new CertificateHelper(
            address(educationCertificate)
        );

        // 3. Deploy CertificateVerifier with EducationCertificate address
        CertificateVerifier certificateVerifier = new CertificateVerifier(
            address(educationCertificate)
        );

        vm.stopBroadcast();

        // Log the deployed addresses
        console.log("EducationCertificate deployed to:", address(educationCertificate));
        console.log("CertificateHelper deployed to:", address(certificateHelper));
        console.log("CertificateVerifier deployed to:", address(certificateVerifier));
    }
} 