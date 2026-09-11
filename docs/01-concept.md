# ProfFound — Concept & Product Definition

> **Status:** Draft v1.0
> **Project:** ProfFound
> **Category:** Web3 / Decentralized Professional Reputation
> **Primary Goal:** Build a verifiable professional reputation system using blockchain.

---

## 1. Overview

**ProfFound** adalah platform Web3 yang memungkinkan seseorang membangun profil profesional dan mengumpulkan **proof of achievement** atau bukti pencapaian yang dapat diverifikasi secara on-chain.

Berbeda dengan portfolio atau CV biasa yang sebagian besar berisi informasi yang diklaim oleh pemiliknya, ProfFound berfokus pada konsep:

```text
Professional Profile
        +
Verified Proof
        +
Blockchain
        =
Verifiable Professional Reputation
```

Tujuan utama ProfFound bukan sekadar membuat portfolio digital, tetapi menyediakan mekanisme untuk membuktikan bahwa suatu pencapaian atau credential benar-benar diterbitkan oleh pihak tertentu dan dimiliki oleh wallet tertentu.

---

# 2. Problem Statement

Dalam sistem profesional tradisional, seseorang biasanya menunjukkan kemampuan melalui:

* CV
* Portfolio
* LinkedIn
* Certificate
* GitHub
* Experience
* Testimonial

Namun informasi tersebut tersebar di berbagai platform dan sebagian besar masih bergantung pada klaim atau kepercayaan terhadap pihak tertentu.

Contoh:

```text
"I am a Solidity Developer."

"I completed this project."

"I contributed to this DAO."

"I received this certification."
```

Masalahnya adalah pihak lain tidak selalu memiliki cara yang mudah untuk memverifikasi klaim tersebut.

Recruiter, company, project owner, atau organisasi harus melakukan pengecekan secara manual.

ProfFound mencoba mengubah model tersebut dari:

```text
CLAIM
  ↓
TRUST
```

menjadi:

```text
CLAIM
  ↓
PROOF
  ↓
VERIFICATION
```

---

# 3. Solution

ProfFound menyediakan sebuah sistem professional reputation yang menggabungkan:

1. Professional Profile
2. Credential
3. Achievement
4. Issuer
5. Blockchain-based Verification

Seorang professional dapat memiliki profile yang berisi informasi profesional.

Pihak yang memiliki kewenangan dapat memberikan credential atau achievement kepada professional tersebut.

Credential tertentu kemudian dicatat melalui smart contract sehingga pihak lain dapat memverifikasi keasliannya.

Model sederhananya:

```text
Issuer
   │
   │ Issue Credential
   ▼
Professional
   │
   │ Owns Credential
   ▼
ProfFound
   │
   │ Verification
   ▼
Verifier
```

---

# 4. Target Users

ProfFound memiliki tiga aktor utama.

## 4.1 Professional

Professional adalah seseorang yang ingin membangun reputasi dan menunjukkan bukti kemampuan atau pencapaiannya.

Contoh:

* Web3 Developer
* Software Developer
* Designer
* Freelancer
* Researcher
* Contributor
* Creator

Professional dapat:

* membuat profile
* menghubungkan wallet
* menerima credential
* melihat credential
* membagikan profile
* membuktikan credential kepada pihak lain

---

## 4.2 Issuer

Issuer adalah pihak yang memiliki kewenangan untuk memberikan credential kepada professional.

Contoh:

* Company
* DAO
* Web3 Project
* Community
* Educational Institution
* Organization
* Project Owner

Issuer dapat:

* memberikan credential
* menentukan penerima credential
* menentukan jenis credential
* mencatat credential ke blockchain
* mencabut credential jika diperlukan

---

## 4.3 Verifier

Verifier adalah pihak yang ingin memeriksa keaslian credential atau reputasi professional.

Contoh:

* Recruiter
* Company
* Client
* Project Owner
* Community
* DAO

Verifier dapat:

* membuka profile
* melihat credential
* memeriksa issuer
* memeriksa recipient
* memeriksa timestamp
* memverifikasi status credential melalui blockchain

---

# 5. Core Concept

Konsep utama ProfFound adalah:

> **"Don't just claim your professional achievements. Prove them."**

ProfFound membedakan antara:

### Claim

Informasi yang diklaim oleh user.

```text
"I am a Solidity Developer."
```

### Proof

Bukti yang dapat diverifikasi.

```text
Credential
Issuer
Recipient
Timestamp
Blockchain Record
```

### Verification

Proses pihak lain untuk memastikan proof tersebut valid.

```text
Proof
  ↓
Smart Contract
  ↓
Valid?
  ↓
YES → VERIFIED
NO  → INVALID
```

---

# 6. Credential Model

Credential merupakan salah satu komponen utama ProfFound.

Contoh credential:

```text
Solidity Developer
Web3 Contributor
Project Contributor
Smart Contract Deployment
Open Source Contributor
Course Completion
Certification
Internship
Achievement
```

Contoh hubungan:

```text
Issuer
  │
  │ "Solidity Developer"
  ▼
Azfa
```

Credential tidak hanya menjadi teks pada profile.

Credential harus memiliki informasi yang dapat diverifikasi.

Contoh:

```text
Credential
├── Credential ID
├── Issuer
├── Recipient
├── Credential Type
├── Timestamp
├── Status
└── Proof
```

---

# 7. Issuer Trust Model

ProfFound tidak boleh menganggap semua credential memiliki tingkat kepercayaan yang sama.

Credential yang dibuat oleh user sendiri berbeda dengan credential yang diterbitkan oleh organization.

Model dasar:

```text
Self Claim
    ↓
Low Trust

Community / Project
    ↓
Medium Trust

Verified Organization
    ↓
Higher Trust
```

Untuk MVP, ProfFound akan berfokus pada credential yang diterbitkan oleh pihak lain kepada professional.

Dengan demikian:

```text
Professional
      │
      │ receives
      ▼
Credential
      ▲
      │ issued by
      │
Issuer
```

Professional tidak dapat secara sepihak membuat credential resmi untuk dirinya sendiri.

---

# 8. Why Blockchain?

Blockchain digunakan bukan hanya karena ProfFound merupakan project Web3.

Blockchain digunakan karena ProfFound membutuhkan mekanisme untuk membuat proof yang:

* dapat diverifikasi
* memiliki timestamp
* terhubung dengan wallet
* sulit dimanipulasi secara sepihak
* dapat diverifikasi tanpa bergantung sepenuhnya pada database ProfFound

Contoh data yang cocok dicatat on-chain:

```text
Credential ID
Issuer
Recipient
Credential Type
Timestamp
Status
Proof / Hash
```

Blockchain menjadi sumber verifikasi untuk data tersebut.

---

# 9. On-Chain vs Off-Chain

Tidak semua data ProfFound akan disimpan di blockchain.

## On-Chain

Data yang membutuhkan verification.

```text
Wallet Address
Credential ID
Issuer
Recipient
Credential Type
Timestamp
Credential Status
Proof / Hash
```

## Off-Chain

Data yang lebih cocok disimpan di database atau decentralized storage.

```text
Name
Bio
Profile Picture
Description
CV
Project Description
Project Image
GitHub URL
Social Links
Additional Metadata
```

Arsitektur konseptual:

```text
                    ProfFound
                       │
             ┌─────────┴─────────┐
             │                   │
         OFF-CHAIN            ON-CHAIN
             │                   │
          Database          Smart Contract
             │                   │
          Profile            Credential
          Metadata              Proof
          Projects           Verification
             │                   │
             └─────────┬─────────┘
                       │
                    Frontend
                       │
                     Wallet
```

---

# 10. Core User Flow

## Professional

```text
Connect Wallet
      ↓
Create Profile
      ↓
Complete Professional Profile
      ↓
Receive Credential
      ↓
Credential Recorded
      ↓
Profile Shows Verified Credential
```

## Issuer

```text
Connect Wallet
      ↓
Issuer Dashboard
      ↓
Select Professional
      ↓
Create Credential
      ↓
Confirm Transaction
      ↓
Credential Recorded On-Chain
```

## Verifier

```text
Open Professional Profile
      ↓
View Credential
      ↓
Select Credential
      ↓
Read Blockchain Data
      ↓
Verify Issuer
      ↓
Verify Recipient
      ↓
Verify Status
      ↓
VERIFIED
```

---

# 11. MVP Scope

ProfFound versi pertama akan dibuat sesederhana mungkin tetapi tetap menunjukkan konsep Web3 secara nyata.

### MVP Features

#### Professional

* Connect Wallet
* Create Profile
* View Profile
* View Credentials

#### Issuer

* Connect Wallet
* Issue Credential
* View Issued Credentials

#### Verifier

* View public profile
* View credentials
* Verify credential on-chain

#### Smart Contract

* Create credential
* Store credential
* Read credential
* Verify credential
* Revoke credential

---

# 12. MVP Non-Goals

Fitur berikut tidak menjadi prioritas MVP:

* Complex reputation scoring
* Token economy
* DAO governance
* NFT marketplace
* Social network
* Messaging
* Advanced AI reputation system
* Cross-chain support
* Mainnet deployment

Fitur tersebut dapat dipertimbangkan setelah MVP berhasil.

---

# 13. Initial Smart Contract Responsibilities

Smart contract ProfFound bertanggung jawab terhadap data yang membutuhkan trust dan verification.

Secara konseptual:

```text
ProfFound.sol
│
├── Credential
│
├── issueCredential()
│
├── revokeCredential()
│
├── verifyCredential()
│
├── getCredential()
│
└── getCredentials()
```

Smart contract tidak bertanggung jawab terhadap seluruh data profile.

---

# 14. Initial Credential Structure

Struktur awal credential secara konseptual:

```text
Credential
├── id
├── issuer
├── recipient
├── credentialType
├── issuedAt
├── revoked
└── proof
```

Contoh:

```text
Credential ID:
1

Issuer:
0xABC...

Recipient:
0x123...

Credential Type:
"Solidity Developer"

Issued At:
Timestamp

Status:
Active

Proof:
0xDEF...
```

---

# 15. Verification Principle

Credential dianggap valid apabila memenuhi kondisi dasar:

```text
Credential exists
        AND
Issuer exists
        AND
Recipient exists
        AND
Credential is not revoked
```

Secara konseptual:

```text
verifyCredential()
        │
        ├── Credential exists?
        │       └── NO → INVALID
        │
        ├── Revoked?
        │       └── YES → INVALID
        │
        └── Valid
                ↓
             VERIFIED
```

---

# 16. Security Principles

ProfFound harus mempertimbangkan beberapa prinsip keamanan sejak awal.

### Authorization

Tidak semua wallet boleh melakukan semua aksi.

Contoh:

```text
Issuer
   ↓
issueCredential()
```

Tidak boleh:

```text
Random User
   ↓
issueCredential() untuk dirinya sendiri
```

### Credential Ownership

Credential harus memiliki recipient yang jelas.

### Revocation

Issuer harus memiliki mekanisme untuk mencabut credential yang tidak lagi valid.

### Input Validation

Smart contract harus memvalidasi input penting.

### Event Logging

Perubahan penting harus menghasilkan event agar frontend dan blockchain explorer dapat membaca aktivitas tersebut.

---

# 17. Technology Direction

Teknologi awal ProfFound:

### Smart Contract

```text
Solidity
Foundry
Forge
Anvil
```

### Frontend

```text
React
Vite
JavaScript / TypeScript
```

### Wallet

```text
EVM-compatible wallet
```

### Blockchain

Tahap development:

```text
Anvil
   ↓
Ethereum-compatible Testnet
```

---

# 18. Development Roadmap

Pengembangan ProfFound dilakukan secara bertahap.

```text
PHASE 1
Concept
    ↓
PHASE 2
Architecture
    ↓
PHASE 3
Smart Contract Design
    ↓
PHASE 4
Solidity Implementation
    ↓
PHASE 5
Unit Testing
    ↓
PHASE 6
Local Deployment
    ↓
PHASE 7
Frontend
    ↓
PHASE 8
Wallet Integration
    ↓
PHASE 9
DApp Integration
    ↓
PHASE 10
Security Review
    ↓
PHASE 11
Testnet Deployment
```

---

# 19. Definition of Success

ProfFound MVP dianggap berhasil apabila:

1. User dapat menghubungkan wallet.
2. User dapat membuat professional profile.
3. Issuer dapat menerbitkan credential.
4. Credential tersimpan melalui smart contract.
5. Credential memiliki issuer dan recipient yang jelas.
6. Credential dapat dibaca kembali dari blockchain.
7. Credential dapat diverifikasi.
8. Credential dapat dicabut oleh issuer.
9. Frontend dapat membaca data smart contract.
10. Seluruh fungsi utama memiliki automated tests.

---

# 20. Product Philosophy

ProfFound dibangun berdasarkan prinsip:

> **Reputation should be backed by proof.**

Portfolio menjelaskan apa yang seseorang klaim.

ProfFound berusaha menunjukkan apa yang dapat dibuktikan.

```text
Traditional Portfolio

"I can do this."
        ↓
       Trust


ProfFound

"I can do this."
        ↓
      Proof
        ↓
   Verification
        ↓
       Trust
```

---

# 21. Current Project Status

Environment development telah disiapkan menggunakan Foundry.

Current status:

```text
Foundry              ✅
Forge                ✅
Anvil                ✅
Project initialized  ✅
forge-std            ✅
Compilation          ✅
Unit testing         ✅
Local deployment     ✅
```

Contract yang saat ini berada di project:

```text
Counter.sol
```

Contract tersebut hanya digunakan sebagai **initial development test** untuk memastikan environment Foundry berjalan dengan benar.

Contract tersebut nantinya akan digantikan oleh:

```text
ProfFound.sol
```

---

# 22. Next Step

Setelah dokumen konsep ini selesai, development akan dilanjutkan dengan:

```text
01-concept.md
      ↓
02-architecture.md
      ↓
03-user-flow.md
      ↓
04-smart-contract.md
      ↓
ProfFound.sol
```

**Tidak ada smart contract production yang akan dibuat sebelum architecture dan contract specification selesai.**

---

## Final Concept

ProfFound adalah platform professional reputation berbasis Web3 yang memungkinkan professional memiliki profile dan menerima credential dari issuer yang dapat diverifikasi melalui blockchain.

Fokus MVP:

```text
Profile
   +
Credential
   +
Issuer
   +
Blockchain Proof
   +
Verification
```

Tujuan akhirnya:

> **Mengubah professional reputation dari sekadar claim menjadi verifiable proof.**
