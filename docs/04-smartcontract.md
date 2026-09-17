# ProfFound — Smart Contract Specification

> **Contract Name:** `ProfFound`  
> **Source Path:** `src/ProfFound.sol`  
> **Compiler Version:** `0.8.20`  
> **License:** MIT  
> **Status:** Active Development (Milestone 2 Implemented)

---

## 1. Overview

Kontrak `ProfFound` berfungsi sebagai *on-chain registry* untuk penerbitan dan verifikasi kredensial profesional (*Verifiable Credentials*). Kontrak ini memastikan bahwa setiap kredensial memiliki:
1. **Penerbit (Issuer)** yang jelas (`msg.sender`).
2. **Penerima (Recipient)** yang terikat pada alamat wallet tertentu.
3. **Kategori/Spesialisasi Kredensial** (`credentialType`).
4. **Waktu Penerbitan** (`issuedAt`).
5. **Bukti Kriptografis (Proof Hash)** yang merujuk pada metadata pendukung (misal IPFS CID atau hash sertifikat).
6. **Status** yang dapat diaudit (`Valid` atau `Revoked`).

---

## 2. Data Structures

### 2.1 Enums

#### `CredentialStatus`
Mengontrol siklus hidup kredensial:
* `None (0)`: Nilai default EVM. Digunakan untuk mendeteksi ID kredensial yang belum pernah dibuat.
* `Valid (1)`: Kredensial aktif dan sah.
* `Revoked (2)`: Kredensial telah dicabut oleh issuer.

### 2.2 Structs

#### `Credential`
```solidity
struct Credential {
    uint256 id;
    address issuer;
    address recipient;
    string credentialType;
    uint256 issuedAt;
    CredentialStatus status;
    bytes32 proofHash;
}
```

---

## 3. Errors (Gas-Optimized)

Kontrak menggunakan Solidity `custom error` alih-alih `require("string")` untuk menghemat konsumsi gas:

| Custom Error | Alasan Revert |
| :--- | :--- |
| `InvalidRecipient()` | Alamat penerima adalah `address(0)`. |
| `SelfIssuanceNotAllowed()` | Penerbit mencoba menerbitkan kredensial ke wallet-nya sendiri (*self-claim prohibition*). |
| `EmptyCredentialType()` | Parameter `credentialType` dikirimkan dengan string kosong `""`. |
| `CredentialNotFound(uint256 id)` | ID kredensial yang diminta belum ada di penyimpanan. |
| `CredentialAlreadyRevoked(uint256 id)` | Mencoba mencabut kredensial yang sudah berstatus dicabut. |
| `NotIssuer(address caller, address issuer)` | Wallet pemanggil bukan penerbit yang sah dari kredensial tersebut. |

---

## 4. Events

```solidity
event CredentialIssued(
    uint256 indexed id,
    address indexed issuer,
    address indexed recipient,
    string credentialType,
    uint256 issuedAt,
    bytes32 proofHash
);

event CredentialRevoked(
    uint256 indexed id,
    address indexed issuer,
    uint256 revokedAt
);
```
* Indeks (`indexed`): Memungkinkan *dApp frontend*, *The Graph*, atau *indexer* memfilter riwayat penerbitan dan pencabutan kredensial secara efisien.

---

## 5. Storage / State Variables

* `uint256 private _credentialIdCounter`: Counter auto-increment ID kredensial (dimulai dari 1).
* `mapping(uint256 => Credential) private _credentials`: Mapping penyimpanan utama `id => Credential`.
* `mapping(address => uint256[]) private _recipientCredentials`: Indeks daftar ID kredensial yang dimiliki oleh seorang penerima.

---

## 6. Implemented Functions

### 6.1 `issueCredential`
```solidity
function issueCredential(
    address recipient,
    string calldata credentialType,
    bytes32 proofHash
) external returns (uint256 newId)
```
* **Akses**: Publik / Siapa pun (setiap pihak yang memanggil bertindak sebagai `issuer`).
* **Proteksi**:
  * Menolak `recipient == address(0)`.
  * Menolak `recipient == msg.sender` (mencegah klaim sepihak).
  * Menolak `bytes(credentialType).length == 0`.
* **Output**: Mengembalikan `newId` yang diterbitkan.

### 6.2 `revokeCredential`
```solidity
function revokeCredential(uint256 id) external
```
* **Akses**: Hanya `issuer` asli kredensial (`msg.sender == cred.issuer`).
* **Proteksi**:
  * Menolak jika ID tidak ditemukan (`CredentialNotFound`).
  * Menolak jika pemanggil bukan issuer (`NotIssuer`).
  * Menolak jika sudah dicabut (`CredentialAlreadyRevoked`).
* **Mutasi**: Mengubah status kredensial menjadi `CredentialStatus.Revoked` dan memancarkan event `CredentialRevoked`.

### 6.3 View Functions
* `getCredential(uint256 id) external view returns (Credential memory)`: Mengambil data lengkap kredensial.
* `getCredentialsByRecipient(address recipient) external view returns (uint256[] memory)`: Mengambil array ID kredensial milik seorang profesional.
* `totalCredentials() external view returns (uint256)`: Mengambil jumlah total kredensial yang telah diterbitkan di platform.
* `isValid(uint256 id) external view returns (bool)`: Helper cepat untuk memeriksa apakah kredensial aktif (`true`) atau tidak valid/dicabut (`false`).

---

## 7. Testing Summary

Unit test diimplementasikan di `test/ProfFound.t.sol`:
* Total Test: 13 Unit Tests (termasuk Fuzz Testing 256 runs, Negative/Revert tests, dan State Transition checks).
* Status: **100% Passed**.
