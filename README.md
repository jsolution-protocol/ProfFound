# ProfFound — Decentralized Verifiable Credential & Professional Reputation Protocol

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FF4B4B?logo=ethereum)](https://getfoundry.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 13 Passed](https://img.shields.io/badge/Tests-13%20Passed%20(100%25)-brightgreen)](test/ProfFound.t.sol)

> **"Don't just claim your professional achievements. Prove them."**

ProfFound is an Ethereum-native smart contract protocol engineered to eliminate fraudulent professional claims (resume/CV padding) by anchoring verifiable credentials directly on-chain. It establishes an immutable, auditable, and tamper-proof reputation layer for Web3 developers, researchers, organizations, and decentralized autonomous organizations (DAOs).

---

## 📌 Executive Summary & Problem Statement

In the traditional hiring and freelancing ecosystem, credentials rely entirely on subjective trust:
* **LinkedIn & CVs**: Anyone can claim mastery without cryptographic proof.
* **Centralized Certificates**: PDF certificates are easily forged and cumbersome to audit.
* **Verification Friction**: Recruiters and clients waste hours manually verifying credentials.

**ProfFound transforms this into an on-chain verification model:**

```text
TRADITIONAL:  CLAIM  ──────────────► TRUST (Subjective, Fragile)

PROFFOUND:    CLAIM  ──► PROOF (IPFS) ──► VERIFICATION (EVM Smart Contract)
```

---

## 🏗️ Protocol Architecture & Data Flow

ProfFound implements a **minimalist on-chain storage pattern** to guarantee maximum decentralization while maintaining optimal gas efficiency.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        OFF-CHAIN METADATA LAYER                        │
│                                                                        │
│   Issuer builds Metadata JSON ──► Uploaded to IPFS ──► Metadata CID    │
│            │                                                  │        │
│            └────────► Compute keccak256(metadataJSON) ◄───────┘        │
│                                   │                                    │
│                         bytes32 proofHash                              │
└───────────────────────────────────┼────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    ON-CHAIN REGISTRY (ProfFound.sol)                   │
│                                                                        │
│  [Issuer]    ──► issueCredential(recipient, type, proofHash)           │
│  [Issuer]    ──► revokeCredential(id)  [Strict Access Control]         │
│  [Verifier]  ──► isValid(id)           [Zero-Gas View Helper]          │
│  [Recipient] ──► getCredentialsByRecipient(address)                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Smart Contract Specification (`src/ProfFound.sol`)

### Core State Structures

#### `Credential` Struct
```solidity
struct Credential {
    uint256 id;                 // Unique auto-incrementing identifier
    address issuer;             // Cryptographic address of issuing entity
    address recipient;          // Wallet address of certified professional
    string credentialType;      // Credential title (e.g., "Solidity Engineer")
    uint256 issuedAt;           // Block timestamp of issuance
    CredentialStatus status;    // Lifecycle state: None (0), Valid (1), Revoked (2)
    bytes32 proofHash;          // Cryptographic digest of off-chain metadata
}
```

#### Key Functions
| Function | Visibility | Gas Cost | Description |
|---|---|---|---|
| `issueCredential(address, string, bytes32)` | External | ~226k gas | Issues a new verifiable credential, increments global ID, updates recipient index, and emits `CredentialIssued`. |
| `revokeCredential(uint256 id)` | External | ~2.8k gas | Revokes an existing credential. Strictly callable **only by the original issuer**. Emits `CredentialRevoked`. |
| `isValid(uint256 id)` | External View | **0 gas** (off-chain) | Instant boolean check returning `true` if credential exists and is actively valid. |
| `getCredential(uint256 id)` | External View | **0 gas** (off-chain) | Returns the full `Credential` struct. Reverts with `CredentialNotFound` if invalid. |
| `getCredentialsByRecipient(address)` | External View | **0 gas** (off-chain) | Returns array of all credential IDs owned by the specified recipient. |
| `totalCredentials()` | External View | **0 gas** (off-chain) | Global counter of all credentials minted on the protocol. |

---

## 🛡️ Security & Access Control

1. **Anti-Self-Claim Guard**: Reverts with `SelfIssuanceNotAllowed()` if `recipient == msg.sender`.
2. **Zero-Address Protection**: Reverts with `InvalidRecipient()` if issued to `address(0)`.
3. **Issuer Sovereignty**: Reverts with `NotIssuer(caller, issuer)` if any third party or recipient attempts to revoke a credential.
4. **Anti-Griefing & Double-Revocation Guard**: Reverts with `CredentialAlreadyRevoked(id)` if an issuer attempts to revoke a previously revoked credential.
5. **Checks-Effects-Interactions (CEI)**: State mutations are performed atomically prior to event emissions. No external calls or ether transfers, completely eliminating reentrancy vulnerabilities.

---

## ⚡ Gas Optimization Highlights

* **Calldata Parameters**: `string calldata credentialType` prevents expensive memory allocations on contract calls.
* **Custom Solidity Errors**: Replacing `require(condition, "error string")` with 4-byte custom errors saves 50–80 gas per revert branch.
* **Lightweight Recipient Index**: Storing `uint256[]` ID pointers in `_recipientCredentials` rather than duplicating full structs saves significant `SSTORE` overhead.
* **Foundry Solc Optimizer**: Configured with 200 runs optimization, reducing execution gas across all write functions.

---

## 🧪 Comprehensive Testing Suite (`test/ProfFound.t.sol`)

All protocol behavior is verified via Foundry's high-speed testing harness, encompassing unit, revert, state transition, and property-based fuzz tests.

```bash
$ forge test -vvvv
```

```text
Ran 13 tests for test/ProfFound.t.sol:ProfFoundTest
[PASS] testFuzz_IssueCredential_ValidRecipients(address) (runs: 256)
[PASS] test_InitialState()
[PASS] test_IssueCredential_Success()
[PASS] test_IssueMultipleCredentials_IncrementsId()
[PASS] test_IsValid_StateTransitions()
[PASS] test_RevertIf_AlreadyRevoked()
[PASS] test_RevertIf_CredentialNotFound()
[PASS] test_RevertIf_EmptyCredentialType()
[PASS] test_RevertIf_RecipientIsZeroAddress()
[PASS] test_RevertIf_RevokeByNonIssuer()
[PASS] test_RevertIf_RevokeNonExistent()
[PASS] test_RevertIf_SelfIssuance()
[PASS] test_RevokeCredential_Success()
Suite result: ok. 13 passed; 0 failed; 0 skipped (100% Pass Rate)
```

---

## 🚀 Quickstart & Usage

### 1. Prerequisites
* [Foundry (forge, cast, anvil)](https://getfoundry.sh/)
* [Node.js](https://nodejs.org/) (v18+)

### 2. Installation & Build
```bash
# Clone the repository
git clone https://github.com/jsolution-protocol/ProfFound.git
cd ProfFound

# Build the smart contracts
forge build
```

### 3. Run Automated Tests
```bash
forge test
```

### 4. Generate Off-Chain Proof Hash
```bash
# Computes the keccak256 digest of sample metadata
node scripts/generate-proof-hash.js metadata/sample-credential.json
```

### 5. Local Deployment Simulation
```bash
# Simulate local deployment
forge script script/DeployProfFound.s.sol
```

### 6. Live Testnet Deployment (Sepolia)
```bash
# 1. Configure your environment
cp .env.example .env
# Fill in SEPOLIA_RPC_URL, PRIVATE_KEY, and ETHERSCAN_API_KEY in .env

# 2. Deploy and broadcast to Sepolia
forge script script/DeployProfFound.s.sol:DeployProfFound \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

---

## 📁 Repository Structure

```text
ProfFound/
├── docs/
│   ├── 00-guardrails.md      # AI pair-programming rules & developer boundaries
│   ├── 01-concept.md         # Product philosophy & decentralized reputation concept
│   ├── 02-architecture.md    # EVM storage layout & on/off-chain data boundaries
│   ├── 03-userflow.md        # Issuer, Recipient, and Verifier transaction flows
│   ├── 04-smartcontract.md   # Complete technical smart contract specification
│   └── 05-security.md        # Threat modeling & security analysis
├── metadata/
│   ├── credential-schema.json# Standard JSON schema for off-chain metadata
│   └── sample-credential.json# Production example of credential metadata payload
├── script/
│   └── DeployProfFound.s.sol # Foundry deployment script
├── scripts/
│   └── generate-proof-hash.js# Zero-dependency proofHash calculation utility
├── src/
│   └── ProfFound.sol         # Core verifiable credentials smart contract
├── test/
│   └── ProfFound.t.sol       # 13 Foundry test suites (unit, revert, fuzz)
├── .env.example              # Template for deployment variables
├── foundry.toml              # Compiler & optimizer configuration
└── README.md                 # Project presentation & documentation
```

---

## 👨‍💻 Developer & Author

* **Lead Smart Contract Developer**: Azfa
* **Focus**: Smart Contract Engineering, EVM Architecture, Gas Optimization, Protocol Security
* **Target Chains**: Ethereum, Arbitrum, Base, Optimism
