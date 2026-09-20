export const PROFFOUND_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const RPC_URL = "http://127.0.0.1:8545";

export const PROFFOUND_ABI = [
  {
    "type": "function",
    "name": "getCredential",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ProfFound.Credential",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "issuer", "type": "address", "internalType": "address" },
          { "name": "recipient", "type": "address", "internalType": "address" },
          { "name": "credentialType", "type": "string", "internalType": "string" },
          { "name": "issuedAt", "type": "uint256", "internalType": "uint256" },
          { "name": "status", "type": "uint8", "internalType": "enum ProfFound.CredentialStatus" },
          { "name": "proofHash", "type": "bytes32", "internalType": "bytes32" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCredentialsByRecipient",
    "inputs": [{ "name": "recipient", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isValid",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "issueCredential",
    "inputs": [
      { "name": "recipient", "type": "address", "internalType": "address" },
      { "name": "credentialType", "type": "string", "internalType": "string" },
      { "name": "proofHash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [{ "name": "newId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revokeCredential",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalCredentials",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CredentialIssued",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "issuer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "recipient", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "credentialType", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "issuedAt", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "proofHash", "type": "bytes32", "indexed": false, "internalType": "bytes32" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CredentialRevoked",
    "inputs": [
      { "name": "id", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "issuer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "revokedAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
];
