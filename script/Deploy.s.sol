// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/EducationCertificate.sol";
import "../src/CertificateHelper.sol";
import "../src/CertificateVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployerAddress);
        
        vm.startBroadcast(deployerPrivateKey);

        EducationCertificate educationCertificate = new EducationCertificate();
        CertificateHelper certificateHelper = new CertificateHelper(address(educationCertificate));
        CertificateVerifier certificateVerifier = new CertificateVerifier(address(educationCertificate));

        console.log("EducationCertificate deployed to:", address(educationCertificate));
        console.log("CertificateHelper deployed to:", address(certificateHelper));
        console.log("CertificateVerifier deployed to:", address(certificateVerifier));
        console.log("Owner address:", educationCertificate.owner());

        vm.stopBroadcast();
    }
} 