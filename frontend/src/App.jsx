import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { PROFFOUND_ADDRESS, RPC_URL, PROFFOUND_ABI } from "./contractConfig";

export default function App() {
  const [activeTab, setActiveTab] = useState("verify");
  const [totalCount, setTotalCount] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(false);

  // --- TAB 1: VERIFY / QUERY STATES ---
  const [queryId, setQueryId] = useState("1");
  const [credentialData, setCredentialData] = useState(null);
  const [isCredentialValid, setIsCredentialValid] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [recipientQuery, setRecipientQuery] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [recipientIds, setRecipientIds] = useState(null);
  const [recipientLoading, setRecipientLoading] = useState(false);

  // --- TAB 2: ISSUE CREDENTIAL STATES ---
  const [recipientAddress, setRecipientAddress] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [credentialType, setCredentialType] = useState("Senior Solidity Developer");
  const [proofHash, setProofHash] = useState("0x10c55216a67a919646920487ac86afdecd0f759578441db4b883227d495a36b8");
  const [issuerKey, setIssuerKey] = useState("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState("");
  const [issueError, setIssueError] = useState("");

  // --- TAB 3: REVOKE CREDENTIAL STATES ---
  const [revokeId, setRevokeId] = useState("1");
  const [revokeKey, setRevokeKey] = useState("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState("");
  const [revokeError, setRevokeError] = useState("");

  // Get read-only provider connected to local Anvil
  const getReadOnlyContract = () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Contract(PROFFOUND_ADDRESS, PROFFOUND_ABI, provider);
  };

  // Fetch global total credentials
  const fetchTotalCredentials = async () => {
    try {
      setLoadingTotal(true);
      const contract = getReadOnlyContract();
      const count = await contract.totalCredentials();
      setTotalCount(Number(count));
    } catch (err) {
      console.error("Gagal mengambil total credentials:", err);
    } finally {
      setLoadingTotal(false);
    }
  };

  useEffect(() => {
    fetchTotalCredentials();
  }, []);

  // --- ACTION: QUERY CREDENTIAL BY ID ---
  const handleQueryCredential = async (e) => {
    e?.preventDefault();
    setVerifyLoading(true);
    setVerifyError("");
    setCredentialData(null);
    setIsCredentialValid(null);

    try {
      const contract = getReadOnlyContract();
      const [cred, valid] = await Promise.all([
        contract.getCredential(queryId),
        contract.isValid(queryId)
      ]);

      setCredentialData({
        id: cred.id.toString(),
        issuer: cred.issuer,
        recipient: cred.recipient,
        credentialType: cred.credentialType,
        issuedAt: new Date(Number(cred.issuedAt) * 1000).toLocaleString(),
        status: Number(cred.status), // 0: None, 1: Valid, 2: Revoked
        proofHash: cred.proofHash
      });
      setIsCredentialValid(valid);
    } catch (err) {
      console.error(err);
      setVerifyError("Kredensial dengan ID tersebut tidak ditemukan di blockchain (reverted).");
    } finally {
      setVerifyLoading(false);
    }
  };

  // --- ACTION: QUERY BY RECIPIENT ---
  const handleQueryByRecipient = async (e) => {
    e?.preventDefault();
    setRecipientLoading(true);
    setRecipientIds(null);

    try {
      const contract = getReadOnlyContract();
      const ids = await contract.getCredentialsByRecipient(recipientQuery.trim());
      setRecipientIds(ids.map((id) => id.toString()));
    } catch (err) {
      console.error(err);
    } finally {
      setRecipientLoading(false);
    }
  };

  // --- ACTION: ISSUE CREDENTIAL ---
  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setIssueLoading(true);
    setIssueSuccess("");
    setIssueError("");

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(issuerKey.trim(), provider);
      const contract = new ethers.Contract(PROFFOUND_ADDRESS, PROFFOUND_ABI, wallet);

      const tx = await contract.issueCredential(
        recipientAddress.trim(),
        credentialType.trim(),
        proofHash.trim()
      );
      const receipt = await tx.wait();

      setIssueSuccess(`Kredensial berhasil diterbitkan! Tx Hash: ${receipt.hash}`);
      fetchTotalCredentials();
    } catch (err) {
      console.error(err);
      setIssueError(err.reason || err.message || "Gagal menerbitkan kredensial.");
    } finally {
      setIssueLoading(false);
    }
  };

  // --- ACTION: REVOKE CREDENTIAL ---
  const handleRevokeCredential = async (e) => {
    e.preventDefault();
    setRevokeLoading(true);
    setRevokeSuccess("");
    setRevokeError("");

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(revokeKey.trim(), provider);
      const contract = new ethers.Contract(PROFFOUND_ADDRESS, PROFFOUND_ABI, wallet);

      const tx = await contract.revokeCredential(revokeId);
      const receipt = await tx.wait();

      setRevokeSuccess(`Kredensial ID #${revokeId} berhasil dicabut! Tx Hash: ${receipt.hash}`);
      if (queryId === revokeId) {
        handleQueryCredential();
      }
    } catch (err) {
      console.error(err);
      setRevokeError(err.reason || err.message || "Gagal mencabut kredensial. Pastikan Anda adalah issuer asli.");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER PANEL */}
      <header className="header-panel">
        <div className="header-title">
          <h1>ProfFound</h1>
          <p>Decentralized Verifiable Professional Reputation Protocol</p>
        </div>
        <div className="stats-badges">
          <div className="badge">
            <span className="badge-label">Network:</span>
            <span className="badge-value">Anvil (31337)</span>
          </div>
          <div className="badge">
            <span className="badge-label">Total Minted:</span>
            <span className="badge-value">{loadingTotal ? "..." : totalCount}</span>
          </div>
          <div className="badge">
            <span className="badge-label">Contract:</span>
            <span className="badge-value">{PROFFOUND_ADDRESS.slice(0, 6)}...{PROFFOUND_ADDRESS.slice(-4)}</span>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === "verify" ? "active" : ""}`}
          onClick={() => setActiveTab("verify")}
        >
          🔍 Verifikasi & Audit Kredensial
        </button>
        <button
          className={`tab-btn ${activeTab === "issue" ? "active" : ""}`}
          onClick={() => setActiveTab("issue")}
        >
          ✍️ Terbitkan Kredensial Baru
        </button>
        <button
          className={`tab-btn ${activeTab === "revoke" ? "active" : ""}`}
          onClick={() => setActiveTab("revoke")}
        >
          ✂️ Cabut Kredensial (Issuer)
        </button>
      </nav>

      {/* TAB 1: VERIFICATION & EXPLORER */}
      {activeTab === "verify" && (
        <div>
          {/* Query by ID */}
          <div className="card-panel">
            <h2 className="card-title">🔍 Verifikasi On-Chain Berdasarkan ID</h2>
            <form onSubmit={handleQueryCredential} style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                min="1"
                className="form-input"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                placeholder="Masukkan nomor ID Kredensial (misal: 1)"
                style={{ maxWidth: "300px" }}
                required
              />
              <button type="submit" className="btn-primary" disabled={verifyLoading}>
                {verifyLoading ? "Memeriksa..." : "Periksa Keabsahan"}
              </button>
            </form>

            {verifyError && <div className="alert-box alert-error">{verifyError}</div>}

            {credentialData && (
              <div className="credential-result">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>Kredensial #{credentialData.id}</h3>
                  <span className={`status-tag ${isCredentialValid ? "valid" : "revoked"}`}>
                    {isCredentialValid ? "✓ VALID & SAH" : "✗ REVOKED / DICABUT"}
                  </span>
                </div>

                <div className="field-grid">
                  <div className="field-item">
                    <div className="field-label">Judul / Keahlian</div>
                    <div className="field-val" style={{ color: "var(--accent-blue)", fontWeight: "bold" }}>
                      {credentialData.credentialType}
                    </div>
                  </div>
                  <div className="field-item">
                    <div className="field-label">Waktu Diterbitkan</div>
                    <div className="field-val">{credentialData.issuedAt}</div>
                  </div>
                  <div className="field-item">
                    <div className="field-label">Alamat Penerbit (Issuer)</div>
                    <div className="field-val">{credentialData.issuer}</div>
                  </div>
                  <div className="field-item">
                    <div className="field-label">Alamat Penerima (Recipient)</div>
                    <div className="field-val">{credentialData.recipient}</div>
                  </div>
                  <div className="field-item" style={{ gridColumn: "1 / -1" }}>
                    <div className="field-label">Bukti Kriptografis (Proof Hash / IPFS)</div>
                    <div className="field-val">{credentialData.proofHash}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Query by Recipient Address */}
          <div className="card-panel">
            <h2 className="card-title">👤 Cari Kredensial Milik Profesional</h2>
            <form onSubmit={handleQueryByRecipient} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                className="form-input"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                placeholder="Alamat Wallet Penerima (0x...)"
                required
              />
              <button type="submit" className="btn-secondary" disabled={recipientLoading}>
                {recipientLoading ? "Mencari..." : "Cari Portofolio"}
              </button>
            </form>

            {recipientIds && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Ditemukan <strong>{recipientIds.length}</strong> kredensial untuk wallet ini:
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {recipientIds.length === 0 ? (
                    <span style={{ color: "var(--text-secondary)" }}>Belum ada kredensial yang diterbitkan.</span>
                  ) : (
                    recipientIds.map((id) => (
                      <button
                        key={id}
                        className="btn-secondary"
                        onClick={() => {
                          setQueryId(id);
                          handleQueryCredential();
                        }}
                      >
                        Lihat Kredensial #{id} ↗
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ISSUE CREDENTIAL */}
      {activeTab === "issue" && (
        <div className="card-panel">
          <h2 className="card-title">✍️ Formulir Penerbitan Kredensial On-Chain</h2>
          <form onSubmit={handleIssueCredential}>
            <div className="form-group">
              <label>Alamat Penerima (Recipient Wallet Address)</label>
              <input
                type="text"
                className="form-input"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
              />
              <div className="hint-text">Contoh: Dompet Bob (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)</div>
            </div>

            <div className="form-group">
              <label>Kategori / Judul Kredensial (Credential Type)</label>
              <input
                type="text"
                className="form-input"
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                required
              />
              <div className="hint-text">Contoh: "Senior Solidity Developer", "Hackathon Winner", "Security Auditor"</div>
            </div>

            <div className="form-group">
              <label>Bukti Kriptografis (Proof Hash - bytes32)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="form-input"
                  value={proofHash}
                  onChange={(e) => setProofHash(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setProofHash(ethers.keccak256(ethers.toUtf8Bytes("Demo Proof " + Date.now())))}
                >
                  Generate Hash Baru
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Private Key Penerbit (Alice / Anvil Account 0)</label>
              <input
                type="password"
                className="form-input"
                value={issuerKey}
                onChange={(e) => setIssuerKey(e.target.value)}
                required
              />
              <div className="hint-text">Gunakan Private Key Akun 0 Anvil untuk simulasi penerbitan lokal</div>
            </div>

            <button type="submit" className="btn-primary" disabled={issueLoading}>
              {issueLoading ? "Menerbitkan ke Blockchain..." : "Terbitkan Kredensial On-Chain"}
            </button>
          </form>

          {issueSuccess && <div className="alert-box alert-success">{issueSuccess}</div>}
          {issueError && <div className="alert-box alert-error">{issueError}</div>}
        </div>
      )}

      {/* TAB 3: REVOKE CREDENTIAL */}
      {activeTab === "revoke" && (
        <div className="card-panel">
          <h2 className="card-title">✂️ Pembatalan / Pencabutan Kredensial</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Hanya penerbit asli yang memiliki hak teknis untuk mencabut kredensial. Jika orang lain mencoba, transaksi akan otomatis dibatalkan (reverted) oleh smart contract.
          </p>
          <form onSubmit={handleRevokeCredential}>
            <div className="form-group">
              <label>ID Kredensial yang Ingin Dicabut</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={revokeId}
                onChange={(e) => setRevokeId(e.target.value)}
                style={{ maxWidth: "300px" }}
                required
              />
            </div>

            <div className="form-group">
              <label>Private Key Pemanggil (Harus Akun Penerbit Asli)</label>
              <input
                type="password"
                className="form-input"
                value={revokeKey}
                onChange={(e) => setRevokeKey(e.target.value)}
                required
              />
              <div className="hint-text">
                Coba ganti dengan Private Key Charlie (<code>0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a</code>) untuk menguji penolakan sistem!
              </div>
            </div>

            <button type="submit" className="btn-danger" disabled={revokeLoading}>
              {revokeLoading ? "Memproses Pencabutan..." : "Cabut Kredensial Permanen"}
            </button>
          </form>

          {revokeSuccess && <div className="alert-box alert-success">{revokeSuccess}</div>}
          {revokeError && <div className="alert-box alert-error">{revokeError}</div>}
        </div>
      )}
    </div>
  );
}
