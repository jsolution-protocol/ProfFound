import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { PROFFOUND_ADDRESS, RPC_URL, PROFFOUND_ABI } from "./contractConfig";

const SUPPORTED_CHAINS = {
  31337: "Anvil Local (31337)",
  11155111: "Ethereum Sepolia (11155111)",
  84532: "Base Sepolia (84532)",
  1: "Ethereum Mainnet (1)"
};

export default function App() {
  const [activeTab, setActiveTab] = useState("verify");
  const [totalCount, setTotalCount] = useState(0);

  // --- WEB3 WALLET STATES ---
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState("");
  const [issueError, setIssueError] = useState("");

  // --- TAB 3: REVOKE CREDENTIAL STATES ---
  const [revokeId, setRevokeId] = useState("1");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState("");
  const [revokeError, setRevokeError] = useState("");

  // Provider helper: Uses BrowserProvider if MetaMask available, otherwise falls back to RPC_URL
  const getReadOnlyContract = () => {
    let provider;
    if (typeof window !== "undefined" && window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      provider = new ethers.JsonRpcProvider(RPC_URL);
    }
    return new ethers.Contract(PROFFOUND_ADDRESS, PROFFOUND_ABI, provider);
  };

  // Get signer contract from connected MetaMask wallet
  const getSignerContract = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask tidak terdeteksi di browser Anda. Harap pasang ekstensi MetaMask.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(PROFFOUND_ADDRESS, PROFFOUND_ABI, signer);
  };

  // --- WALLET CONNECTION LOGIC ---
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask belum terpasang! Silakan unduh ekstensi dari https://metamask.io");
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (err) {
      console.error("Gagal menghubungkan MetaMask:", err);
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        alert("Permintaan koneksi ditolak di MetaMask.");
      } else {
        alert("Gagal menghubungkan wallet: " + (err.message || err));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  // Fetch global total credentials (reusable after transactions)
  const fetchTotalCredentials = async () => {
    try {
      const contract = getReadOnlyContract();
      const count = await contract.totalCredentials();
      setTotalCount(Number(count));
    } catch (err) {
      console.error("Gagal mengambil total credentials:", err);
    }
  };

  // Check if wallet is already connected & listen to events
  useEffect(() => {
    let isMounted = true;

    // Async initial fetch
    (async () => {
      try {
        const contract = getReadOnlyContract();
        const count = await contract.totalCredentials();
        if (isMounted) setTotalCount(Number(count));
      } catch (err) {
        console.error("Gagal mengambil total credentials:", err);
      }
    })();

    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      provider.send("eth_accounts", []).then((accounts) => {
        if (isMounted && accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          provider.getNetwork().then((net) => {
            if (isMounted) setChainId(Number(net.chainId));
          }).catch(console.error);
        }
      }).catch(console.error);

      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (newChainId) => {
        setChainId(parseInt(newChainId, 16));
        fetchTotalCredentials();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        isMounted = false;
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }

    return () => {
      isMounted = false;
    };
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

  // --- ACTION: ISSUE CREDENTIAL VIA METAMASK ---
  const handleIssueCredential = async (e) => {
    e.preventDefault();
    if (!account) {
      await connectWallet();
      return;
    }

    setIssueLoading(true);
    setIssueSuccess("");
    setIssueError("");

    try {
      const contract = await getSignerContract();
      const tx = await contract.issueCredential(
        recipientAddress.trim(),
        credentialType.trim(),
        proofHash.trim()
      );
      
      setIssueSuccess(`Transaksi disiarkan! Menunggu konfirmasi blok... (Tx: ${tx.hash.slice(0, 10)}...)`);
      const receipt = await tx.wait();

      setIssueSuccess(`✓ Kredensial berhasil diterbitkan on-chain! Tx Hash: ${receipt.hash}`);
      fetchTotalCredentials();
    } catch (err) {
      console.error(err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setIssueError("Transaksi dibatalkan oleh pengguna di MetaMask.");
      } else {
        setIssueError(err.reason || err.message || "Gagal menerbitkan kredensial.");
      }
    } finally {
      setIssueLoading(false);
    }
  };

  // --- ACTION: REVOKE CREDENTIAL VIA METAMASK ---
  const handleRevokeCredential = async (e) => {
    e.preventDefault();
    if (!account) {
      await connectWallet();
      return;
    }

    setRevokeLoading(true);
    setRevokeSuccess("");
    setRevokeError("");

    try {
      const contract = await getSignerContract();
      const tx = await contract.revokeCredential(revokeId);

      setRevokeSuccess(`Transaksi pencabutan disiarkan! Menunggu konfirmasi... (Tx: ${tx.hash.slice(0, 10)}...)`);
      const receipt = await tx.wait();

      setRevokeSuccess(`✓ Kredensial ID #${revokeId} berhasil dicabut! Tx Hash: ${receipt.hash}`);
      if (queryId === revokeId) {
        handleQueryCredential();
      }
    } catch (err) {
      console.error(err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setRevokeError("Pencabutan dibatalkan oleh pengguna di MetaMask.");
      } else {
        setRevokeError(err.reason || err.message || "Gagal mencabut kredensial. Pastikan wallet Anda adalah issuer asli.");
      }
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

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Web3 Wallet Connect Button / Indicator */}
          <div className="wallet-connect-wrapper">
            {account ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="wallet-badge-connected" title={account}>
                  <span className="status-dot-green"></span>
                  <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                  onClick={disconnectWallet}
                  title="Putuskan sambungan wallet di aplikasi"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button className="btn-wallet" onClick={connectWallet} disabled={isConnecting}>
                🦊 {isConnecting ? "Menghubungkan..." : "Hubungkan MetaMask"}
              </button>
            )}
          </div>

          {/* Stats Badges */}
          <div className="stats-badges">
            <div className="badge">
              <span className="badge-label">Network:</span>
              <span className="badge-value">
                {chainId ? (SUPPORTED_CHAINS[chainId] || `Chain ${chainId}`) : "Anvil (31337)"}
              </span>
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
            <form onSubmit={handleQueryCredential} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
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
                    <div className="field-label">Bukti Kriptografis (Proof Hash / IPFS Digest)</div>
                    <div className="field-val">{credentialData.proofHash}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Query by Recipient Address */}
          <div className="card-panel">
            <h2 className="card-title">👤 Cari Kredensial Milik Profesional</h2>
            <form onSubmit={handleQueryByRecipient} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                className="form-input"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                placeholder="Alamat Wallet Penerima (0x...)"
                style={{ flex: 1, minWidth: "260px" }}
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
          
          {!account ? (
            <div className="wallet-notice">
              <p>🦊 <strong>Perhatian:</strong> Anda harus menghubungkan MetaMask untuk menandatangani transaksi penerbitan ini sebagai <em>Issuer</em>.</p>
              <button className="btn-wallet" onClick={connectWallet}>Hubungkan Wallet</button>
            </div>
          ) : (
            <div style={{ marginBottom: "16px" }} className="field-item">
              <div className="field-label">Alamat Penerbit Terhubung (Issuer)</div>
              <div className="field-val" style={{ color: "var(--accent-green)" }}>
                {account} (MetaMask Connected)
              </div>
            </div>
          )}

          <form onSubmit={handleIssueCredential}>
            <div className="form-group">
              <label>Alamat Penerima (Recipient Wallet Address)</label>
              <input
                type="text"
                className="form-input"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                required
              />
              <div className="hint-text">Contoh: Dompet profesional/developer penerima sertifikat</div>
            </div>

            <div className="form-group">
              <label>Kategori / Judul Kredensial (Credential Type)</label>
              <input
                type="text"
                className="form-input"
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                placeholder="Senior Solidity Developer"
                required
              />
              <div className="hint-text">Contoh: "Senior Solidity Developer", "Certified Security Auditor", "Smart Contract Specialist"</div>
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
                  onClick={() => setProofHash(ethers.keccak256(ethers.toUtf8Bytes("ProfFound Proof " + Date.now())))}
                  title="Generate hash keccak256 baru"
                >
                  Generate Hash Baru
                </button>
              </div>
              <div className="hint-text">Hash keccak256 dari metadata JSON off-chain (IPFS)</div>
            </div>

            <button type="submit" className="btn-primary" disabled={issueLoading}>
              {issueLoading ? "Menunggu Konfirmasi MetaMask..." : "Terbitkan Kredensial On-Chain"}
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
            Hanya penerbit asli (*issuer*) yang memiliki wewenang untuk mencabut kredensial. Jika wallet lain mencoba mencabutnya, transaksi akan otomatis dibatalkan (*reverted*) oleh smart contract.
          </p>

          {!account ? (
            <div className="wallet-notice">
              <p>🦊 <strong>Perhatian:</strong> Hubungkan dompet MetaMask Anda yang bertindak sebagai <em>Issuer</em> dari kredensial tersebut.</p>
              <button className="btn-wallet" onClick={connectWallet}>Hubungkan Wallet</button>
            </div>
          ) : (
            <div style={{ marginBottom: "16px" }} className="field-item">
              <div className="field-label">Alamat Penandatangan Transaksi</div>
              <div className="field-val" style={{ color: "var(--accent-blue)" }}>
                {account}
              </div>
            </div>
          )}

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

            <button type="submit" className="btn-danger" disabled={revokeLoading}>
              {revokeLoading ? "Menunggu Konfirmasi MetaMask..." : "Cabut Kredensial Permanen"}
            </button>
          </form>

          {revokeSuccess && <div className="alert-box alert-success">{revokeSuccess}</div>}
          {revokeError && <div className="alert-box alert-error">{revokeError}</div>}
        </div>
      )}
    </div>
  );
}
