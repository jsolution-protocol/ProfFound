# ProfFound — Security Analysis & Threat Model

> **Document:** `docs/05-security.md`  
> **Status:** Final Security Audit Specification  
> **Compiler:** Solidity `^0.8.20`  
> **Audited Contract:** `src/ProfFound.sol`

---

## 1. Profil Keamanan Sistem (Security Posture)

Kontrak `ProfFound` dirancang dengan arsitektur **state-registry murni**. Kontrak ini sengaja **tidak menyimpan dana (ETH/ERC-20)** dan **tidak melakukan external call ke kontrak pihak ketiga**. Hal ini secara fundamental mengeliminasi kelas kerentanan terbesar di ekosistem Web3 (seperti reentrancy, flash loan attacks, dan drain dana).

---

## 2. Analisis Vektor Ancaman (Threat Modeling & Mitigations)

| Vektor Ancaman | Potensi Dampak | Mitigasi dalam Kode | Status |
|---|---|---|:---:|
| **Self-Issuance (Self-Claim)** | User menerbitkan kredensial palsu untuk dirinya sendiri dan mengklaim sertifikasi bodong. | `if (recipient == msg.sender) revert SelfIssuanceNotAllowed();` | 🛡️ AMAN |
| **Zero Address Minting** | Kredensial tidak sengaja diterbitkan ke `address(0)` sehingga status terkunci selamanya. | `if (recipient == address(0)) revert InvalidRecipient();` | 🛡️ AMAN |
| **Revocation Hijacking** | Pihak ketiga yang tidak berhak mencoba mencabut kredensial orang lain. | `if (msg.sender != cred.issuer) revert NotIssuer(msg.sender, cred.issuer);` | 🛡️ AMAN |
| **Double Revocation Griefing** | Issuer memanggil revoke berulang kali untuk menimbulkan kebingungan pada log/indexer. | `if (cred.status == CredentialStatus.Revoked) revert CredentialAlreadyRevoked(id);` | 🛡️ AMAN |
| **Phanton Credential Query** | Query ID fiktif yang belum pernah dibuat. | `if (_credentials[id].status == CredentialStatus.None) revert CredentialNotFound(id);` | 🛡️ AMAN |
| **Reentrancy Attack** | Panggilan rekursif untuk membajak alur kontrol kontrak. | **Zero External Calls**. Kontrak hanya memutasi storage lokal sebelum memancarkan event (*Strict Checks-Effects-Interactions*). | 🛡️ AMAN |
| **Gas Griefing / Denial of Service** | DoS akibat iterasi array tanpa batas (*unbounded loop*). | Kontrak tidak memiliki looping di fungsi tulis. Query array penerima (`getCredentialsByRecipient`) hanya bersifat `view` (off-chain execution). | 🛡️ AMAN |
| **Front-Running / Sandwiching** | Manipulasi urutan transaksi oleh bot MEV di mempool. | Transaksi penerbitan kredensial bersifat independen dan non-spekulatif. Tidak ada insentif ekonomi untuk MEV arbitrage. | 🛡️ AMAN |

---

## 3. Evaluasi Prinsip Checks-Effects-Interactions (CEI)

Pada setiap fungsi mutasi state (`issueCredential` dan `revokeCredential`), pola CEI diterapkan secara ketat:

```solidity
// 1. CHECKS (Validasi & Assertion)
if (cred.status == CredentialStatus.None) revert CredentialNotFound(id);
if (msg.sender != cred.issuer) revert NotIssuer(msg.sender, cred.issuer);
if (cred.status == CredentialStatus.Revoked) revert CredentialAlreadyRevoked(id);

// 2. EFFECTS (Perubahan Penyimpanan Lokal)
cred.status = CredentialStatus.Revoked;

// 3. INTERACTIONS (Emisi Event / External Call)
emit CredentialRevoked(id, msg.sender, block.timestamp);
```

Dengan alur ini, state internal selalu diperbarui secara atomik sebelum adanya interaksi keluar dalam bentuk event.

---

## 4. Keamanan Penyimpanan Data & Hash Off-Chain

* **Kekuatan Kriptografis `bytes32 proofHash`**:
  Parameter `proofHash` mewajibkan penggunaan digest 32-byte (misal Keccak-256 atau SHA-256). Penggunaan hash berukuran 256-bit memiliki resistensi tabrakan (*collision resistance*) setara dengan standar keamanan Ethereum itu sendiri.
* **Imutabilitas Bukti**:
  Sekali kredensial diterbitkan dengan `proofHash` tertentu, nilai tersebut tidak dapat dimanipulasi oleh siapa pun (termasuk issuer). Jika dokumen sertifikat diubah di kemudian hari, hash-nya tidak akan lagi cocok, sehingga otomatis terdeteksi sebagai dokumen yang tidak valid.

---

## 5. Ringkasan Pengujian Keamanan

Rangkaian unit test di `test/ProfFound.t.sol` mencakup pengujian negatif terhadap seluruh custom error:
* `test_RevertIf_RecipientIsZeroAddress`
* `test_RevertIf_SelfIssuance`
* `test_RevertIf_EmptyCredentialType`
* `test_RevertIf_CredentialNotFound`
* `test_RevertIf_RevokeByNonIssuer`
* `test_RevertIf_RevokeNonExistent`
* `test_RevertIf_AlreadyRevoked`
* `testFuzz_IssueCredential_ValidRecipients` (Pengujian fuzzer 256 alamat acak)

Semua skenario revert terbukti bekerja tepat sesuai ekspektasi keamanan.
