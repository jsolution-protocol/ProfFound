# ProfFound — Architecture & System Design

> **Document:** `docs/02-architecture.md`  
> **Status:** Final Specification  
> **Target Platform:** Ethereum Virtual Machine (EVM) — Pragma `^0.8.20`

---

## 1. Arsitektur Tingkat Tinggi (High-Level Overview)

ProfFound dirancang dengan prinsip **minimalisme on-chain** (*minimalist on-chain footprint*): hanya menyimpan data kredensial yang esensial untuk validitas hukum dan kriptografis secara on-chain, sedangkan metadata deskriptif kaya (gambar sertifikat, transkrip detail, deskripsi panjang) disimpan di lapisan desentralisasi off-chain (IPFS/Arweave).

```text
┌─────────────────────────────────────────────────────────────┐
│                      OFF-CHAIN LAYER                        │
│                                                             │
│  [Issuer Client] ──── Upload Metadata ───► [IPFS / Arweave] │
│         │                                          │        │
│         │                                    Metadata CID   │
│         ▼                                          │        │
│  Compute Hash (SHA-256 / Keccak-256) ◄─────────────┘        │
│         │                                                   │
│         │ proofHash (bytes32)                               │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ON-CHAIN LAYER (EVM)                      │
│                                                             │
│                Contract: ProfFound.sol                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ State Variables:                                      │  │
│  │  - _credentialIdCounter (uint256)                     │  │
│  │  - _credentials (mapping uint256 => Credential)       │  │
│  │  - _recipientCredentials (mapping address => uint256[])│  │
│  └───────────────────────────────────────────────────────┘  │
│         │                                                   │
│         ├─► issueCredential()    [State Mutation + Event]   │
│         ├─► revokeCredential()   [Access Control + Event]   │
│         ├─► isValid()            [Zero-Gas View Helper]     │
│         └─► getCredential()      [Read Full Struct]         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Batas On-Chain vs Off-Chain (Storage Economics)

Menyimpan teks panjang (string) di storage EVM sangat mahal (sekitar 20.000 gas per slot 32-byte). Oleh karena itu, arsitektur data dibagi secara tegas:

| Data Element | Lokasi | Tipe Data | Alasan Teknis |
|---|---|---|---|
| `id` | **On-Chain** | `uint256` | Kunci unik relasional di EVM storage. |
| `issuer` | **On-Chain** | `address` | Identitas kriptografis penerbit (20 bytes), kunci *access control*. |
| `recipient` | **On-Chain** | `address` | Wallet penerima yang berhak mengklaim kepemilikan kredensial. |
| `credentialType` | **On-Chain** | `string` | Judul singkat kredensial (misal: "Junior Solidity Developer") untuk query langsung. |
| `issuedAt` | **On-Chain** | `uint256` | Timestamp blok Ethereum (`block.timestamp`) sebagai bukti waktu penerbitan. |
| `status` | **On-Chain** | `enum (uint8)` | Status audit (`Valid` vs `Revoked`). |
| `proofHash` | **On-Chain** | `bytes32` | Digest kriptografis dari metadata off-chain (integritas data tamper-proof). |
| *Deskripsi lengkap, logo, PDF sertifikat, badge* | **Off-Chain (IPFS)** | `JSON / File` | Mencegah pembengkakan konsumsi gas (*gas bloat*). |

---

## 3. Pemetaan Penyimpanan EVM (EVM Storage Layout)

Smart contract Solidity mengalokasikan memori persisten ke dalam slot-slot 32-byte berurutan. Berikut pemetaan storage slot pada `ProfFound.sol`:

```text
Slot 0: uint256 private _credentialIdCounter;
Slot 1: mapping(uint256 => Credential) private _credentials;
Slot 2: mapping(address => uint256[]) private _recipientCredentials;
```

### Layout Struct `Credential` di Slot Mapping:
Ketika `_credentials[id]` disimpan:
* Nilai dasar disimpan di slot turunan `keccak256(abi.encode(id, uint256(1)))`:
  * **Offset 0**: `uint256 id` (32 bytes)
  * **Offset 1**: `address issuer` (20 bytes)
  * **Offset 2**: `address recipient` (20 bytes)
  * **Offset 3**: `string credentialType` (pointer string storage)
  * **Offset 4**: `uint256 issuedAt` (32 bytes)
  * **Offset 5**: `CredentialStatus status` (1 byte, menempati slot uint8)
  * **Offset 6**: `bytes32 proofHash` (32 bytes)

---

## 4. Pola Akses & Kontrol Akses (Access Control Model)

1. **Penerbitan Terbuka (Permissionless Issuance)**:
   * Siapa pun dapat bertindak sebagai `issuer`.
   * Sistem tidak mengunci hak penerbit pada satu *admin*, melainkan mengandalkan **reputasi alamat penerbit** (*web-of-trust*).
   * Verifier menilai bobot kredensial berdasarkan reputasi wallet `issuer` yang menandatangani transaksi.
2. **Kedaulatan Penerbit atas Kredensialnya (Issuer Sovereignty)**:
   * Hanya alamat wallet yang menerbitkan (`msg.sender == cred.issuer`) yang memiliki otoritas untuk mencabut (`revokeCredential`).
   * Pihak ketiga atau penerima tidak memiliki kemampuan teknis untuk memodifikasi atau mencabut kredensial tersebut.
3. **Imutabilitas Data Kredensial**:
   * Kredensial yang telah berstatus `Revoked` tidak dapat diubah kembali menjadi `Valid`.
   * Nilai `proofHash`, `issuedAt`, `recipient`, dan `credentialType` bersifat permanen dan tidak dapat diedit (*append-only ledger*).

---

## 5. Optimalisasi Gas (Gas Optimization Strategy)

1. **`calldata` untuk Input String**:
   Parameter `string calldata credentialType` pada `issueCredential` menghindari penyalinan memori yang tidak perlu (*zero-copy from calldata*).
2. **Solidity Custom Errors**:
   Menggunakan `error InvalidRecipient()` alih-alih `require(..., "String error")`, menghemat ~50-80 gas per validasi revert karena hanya menggunakan 4-byte error selector.
3. **Indexing Ringan**:
   `_recipientCredentials` hanya menyimpan array `uint256` ID kredensial (bukan menduplikasi seluruh struct), meminimalkan SSTORE operations.
