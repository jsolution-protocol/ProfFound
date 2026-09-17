# ProfFound — User Flows & Interaction Model

> **Document:** `docs/03-userflow.md`  
> **Status:** Final Specification  
> **Target Actors:** Issuer, Professional (Recipient), Verifier

---

## 1. Tiga Aktor Utama Sistem

```text
┌─────────────────────────────────────────────────────────────┐
│                       PROF FOUND ACTORS                     │
│                                                             │
│   ┌──────────────┐         ┌──────────────┐                 │
│   │    ISSUER    │         │  RECIPIENT   │                 │
│   │ (Organisasi, │         │(Profesional, │                 │
│   │  Perusahaan, │         │  Developer,  │                 │
│   │  Universitas)│         │ Freelancer)  │                 │
│   └──────┬───────┘         └──────▲───────┘                 │
│          │                        │                         │
│          │ 1. Menerbitkan         │ 2. Memiliki & Membagikan│
│          ▼                        │    Portofolio Bukti     │
│   ┌────────────────────────────────────────┐                │
│   │         PROFFOUND SMART CONTRACT       │                │
│   └───────────────────▲────────────────────┘                │
│                       │                                     │
│                       │ 3. Verifikasi Keaslian              │
│                ┌──────┴───────┐                             │
│                │   VERIFIER   │                             │
│                │  (Recruiter, │                             │
│                │ Klien Global,│                             │
│                │     DAO)     │                             │
│                └──────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Alur Penerbit (Issuer Journey)

### A. Alur Penerbitan Kredensial Baru (Issuance Flow)
1. **Penyusunan Metadata Off-Chain**:
   Issuer menyiapkan dokumen rincian sertifikasi dalam format JSON standar (berisi nama keahlian, tanggal, nilai/catatan, nama institusi).
2. **Unggah ke IPFS & Hash**:
   Issuer mengunggah JSON ke IPFS dan menghasilkan digest hash 32-byte (`bytes32 proofHash = keccak256(metadataJSON)`).
3. **Panggilan Transaksi On-Chain**:
   Issuer memanggil fungsi `issueCredential`:
   ```solidity
   profFound.issueCredential(recipientAddress, "Junior Solidity Developer", proofHash);
   ```
4. **Validasi & Konfirmasi**:
   * EVM memvalidasi `recipientAddress != address(0)`, `recipientAddress != msg.sender`, dan `credentialType != ""`.
   * Kontrak menghasilkan ID baru, menyimpan data di storage, dan memancarkan event `CredentialIssued`.
   * Transaksi tercatat di block explorer (Etherscan).

### B. Alur Pencabutan Kredensial (Revocation Flow)
1. **Identifikasi Kredensial**:
   Jika terdapat pelanggaran integritas akademik/profesional, issuer mengambil ID kredensial yang bersangkutan.
2. **Panggilan Transaksi Pencabutan**:
   ```solidity
   profFound.revokeCredential(credentialId);
   ```
3. **Validasi Akses**:
   * EVM memeriksa apakah `msg.sender == cred.issuer`.
   * Status kredensial diperbarui menjadi `Revoked`.
   * Kontrak memancarkan event `CredentialRevoked`.

---

## 3. Alur Penerima (Recipient Journey)

1. **Memberikan Alamat Wallet**:
   Profesional memberikan public address Ethereum mereka ke pihak Issuer.
2. **Menerima Kredensial On-Chain**:
   Saat issuer melakukan transaksi, ID kredensial secara otomatis diindeks ke alamat wallet profesional di dalam mapping `_recipientCredentials[recipient]`.
3. **Melihat Portofolio**:
   Profesional menghubungkan wallet (misal melalui dApp frontend) dan membaca daftar kredensial miliknya menggunakan:
   ```solidity
   uint256[] memory myCreds = profFound.getCredentialsByRecipient(myAddress);
   ```
4. **Membagikan Bukti ke Klien/Recruiter**:
   Profesional cukup memberikan link portofolio (misal: `proffound.id/profile/0xBob...`) atau langsung menyertakan ID kredensial on-chain dan alamat kontrak ProfFound di CV/proposal mereka.

---

## 4. Alur Verifikator (Verifier Journey)

Recruiter atau klien luar negeri yang ingin memverifikasi keahlian profesional tidak perlu menghubungi universitas/issuer secara manual melalui email.

```text
Verifier
   │
   ├─► 1. Panggil isValid(id) ──► Mengembalikan true/false (Cepat & Zero-Gas)
   │
   ├─► 2. Panggil getCredential(id) ──► Baca alamat issuer & proofHash
   │
   ├─► 3. Verifikasi Alamat Issuer ──► Cocokkan dengan wallet resmi institusi
   │
   └─► 4. Verifikasi Proof Hash ──► keccak256(IPFS metadata) == proofHash on-chain
```

1. **Pengecekan Cepat (Zero-Gas View Call)**:
   Verifier memanggil:
   ```solidity
   bool active = profFound.isValid(credentialId);
   ```
   Jika `false`, kredensial langsung ditolak (karena palsu atau telah dicabut).
2. **Audit Detail**:
   Verifier membaca struct lengkap via `getCredential(credentialId)`.
3. **Validasi Kriptografis Proof Hash**:
   Verifier mengunduh payload metadata dari IPFS dan mencocokkan hash-nya dengan `proofHash` di smart contract. Jika sama persis, kredensial terbukti 100% otentik dan bebas manipulasi.
