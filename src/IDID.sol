// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDID {
    struct DIDDocument {
        string did;
        address controller;
        string[] publicKeys;
        string[] services;
        uint256 created;
        uint256 updated;
    }

    event DIDCreated(string did, address indexed controller);
    event DIDUpdated(string did, address indexed controller);

    function createDID(string calldata did, string[] calldata publicKeys, string[] calldata services) external;
    function resolveDID(string calldata did) external view returns (DIDDocument memory);
    function verifyDID(string calldata did, address controller) external view returns (bool);
    function updateDID(string calldata did, string[] calldata publicKeys, string[] calldata services) external;
    function deactivateDID(string calldata did) external;
}