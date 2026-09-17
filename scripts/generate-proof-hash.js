/**
 * ProfFound Proof Hash Generator (Zero-Dependency)
 * Computes the keccak256 hash using Foundry's native `cast` (or SHA-256 fallback via Node.js crypto).
 * 
 * Usage:
 *   node scripts/generate-proof-hash.js metadata/sample-credential.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

function main() {
  const targetPath = process.argv[2] || path.join(__dirname, '../metadata/sample-credential.json');

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: File not found at ${targetPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(targetPath, 'utf8');
  // Canonicalize JSON (consistent compact formatting)
  const canonical = JSON.stringify(JSON.parse(raw));

  let proofHash;
  try {
    // Attempt native Foundry cast keccak
    const stdout = execSync(`cast keccak '${canonical.replace(/'/g, "'\\''")}'`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    proofHash = stdout.trim();
  } catch (e) {
    // Fallback to standard Node.js crypto SHA-256 (32 bytes)
    proofHash = '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
  }

  console.log("=================================================");
  console.log("  ProfFound On-Chain Proof Hash Generator");
  console.log("=================================================");
  console.log(`Source File : ${targetPath}`);
  console.log(`proofHash   : ${proofHash}`);
  console.log("=================================================");
  console.log("Pass this 'proofHash' into issueCredential(recipient, type, proofHash)");
}

main();
