// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ProfFound} from "../src/ProfFound.sol";

contract ProfFoundTest is Test {
    ProfFound public profFound;

    // Test accounts / actors
    address public alice = makeAddr("alice"); // Issuer (e.g., University, DAO, Company)
    address public bob = makeAddr("bob"); // Professional / Recipient
    address public charlie = makeAddr("charlie"); // Third-party / Other recipient

    bytes32 public sampleProofHash = keccak256("ipfs://bafybeicertificate123");

    // Event declaration to match the contract for vm.expectEmit
    event CredentialIssued(
        uint256 indexed id,
        address indexed issuer,
        address indexed recipient,
        string credentialType,
        uint256 issuedAt,
        bytes32 proofHash
    );

    event CredentialRevoked(uint256 indexed id, address indexed issuer, uint256 revokedAt);

    function setUp() public {
        profFound = new ProfFound();
    }

    // =============================================================
    //                     POSITIVE TESTS
    // =============================================================

    function test_InitialState() public view {
        assertEq(profFound.totalCredentials(), 0);
    }

    function test_IssueCredential_Success() public {
        // Alice menerbitkan kredensial ke Bob
        vm.prank(alice);

        // Expect event to be emitted
        vm.expectEmit(true, true, true, true);
        emit CredentialIssued(1, alice, bob, "Junior Solidity Developer", block.timestamp, sampleProofHash);

        uint256 credId = profFound.issueCredential(bob, "Junior Solidity Developer", sampleProofHash);

        // Assert return value & total counter
        assertEq(credId, 1);
        assertEq(profFound.totalCredentials(), 1);

        // Assert stored struct data
        ProfFound.Credential memory cred = profFound.getCredential(1);
        assertEq(cred.id, 1);
        assertEq(cred.issuer, alice);
        assertEq(cred.recipient, bob);
        assertEq(cred.credentialType, "Junior Solidity Developer");
        assertEq(cred.issuedAt, block.timestamp);
        assertEq(uint256(cred.status), uint256(ProfFound.CredentialStatus.Valid));
        assertEq(cred.proofHash, sampleProofHash);

        // Assert recipient indexing
        uint256[] memory bobCreds = profFound.getCredentialsByRecipient(bob);
        assertEq(bobCreds.length, 1);
        assertEq(bobCreds[0], 1);
    }

    function test_IssueMultipleCredentials_IncrementsId() public {
        vm.prank(alice);
        uint256 id1 = profFound.issueCredential(bob, "Solidity Dev", sampleProofHash);

        vm.prank(alice);
        uint256 id2 = profFound.issueCredential(charlie, "Frontend Dev", sampleProofHash);

        vm.prank(alice);
        uint256 id3 = profFound.issueCredential(bob, "Security Auditor", sampleProofHash);

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(profFound.totalCredentials(), 3);

        uint256[] memory bobCreds = profFound.getCredentialsByRecipient(bob);
        assertEq(bobCreds.length, 2);
        assertEq(bobCreds[0], 1);
        assertEq(bobCreds[1], 3);

        uint256[] memory charlieCreds = profFound.getCredentialsByRecipient(charlie);
        assertEq(charlieCreds.length, 1);
        assertEq(charlieCreds[0], 2);
    }

    function test_RevokeCredential_Success() public {
        // Alice menerbitkan kredensial ke Bob
        vm.prank(alice);
        uint256 credId = profFound.issueCredential(bob, "Solidity Dev", sampleProofHash);

        assertTrue(profFound.isValid(credId));

        // Expect event CredentialRevoked terpancar
        vm.expectEmit(true, true, false, true);
        emit CredentialRevoked(credId, alice, block.timestamp);

        // Alice mencabut kredensial
        vm.prank(alice);
        profFound.revokeCredential(credId);

        // Validasi status struct berubah jadi Revoked
        ProfFound.Credential memory cred = profFound.getCredential(credId);
        assertEq(uint256(cred.status), uint256(ProfFound.CredentialStatus.Revoked));

        // Validasi helper isValid sekarang mengembalikan false
        assertFalse(profFound.isValid(credId));
    }

    function test_IsValid_StateTransitions() public {
        // 1. ID tidak ada -> false
        assertFalse(profFound.isValid(999));

        // 2. ID diterbitkan -> true
        vm.prank(alice);
        uint256 credId = profFound.issueCredential(bob, "Web3 Architect", sampleProofHash);
        assertTrue(profFound.isValid(credId));

        // 3. ID dicabut -> false
        vm.prank(alice);
        profFound.revokeCredential(credId);
        assertFalse(profFound.isValid(credId));
    }

    // =============================================================
    //                     NEGATIVE / REVERT TESTS
    // =============================================================

    function test_RevertIf_RecipientIsZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert(ProfFound.InvalidRecipient.selector);
        profFound.issueCredential(address(0), "Solidity Dev", sampleProofHash);
    }

    function test_RevertIf_SelfIssuance() public {
        // Alice mencoba menerbitkan kredensial untuk dirinya sendiri (self-claim)
        vm.prank(alice);
        vm.expectRevert(ProfFound.SelfIssuanceNotAllowed.selector);
        profFound.issueCredential(alice, "Solidity Dev", sampleProofHash);
    }

    function test_RevertIf_EmptyCredentialType() public {
        vm.prank(alice);
        vm.expectRevert(ProfFound.EmptyCredentialType.selector);
        profFound.issueCredential(bob, "", sampleProofHash);
    }

    function test_RevertIf_CredentialNotFound() public {
        // Query ID yang belum ada
        vm.expectRevert(abi.encodeWithSelector(ProfFound.CredentialNotFound.selector, 999));
        profFound.getCredential(999);
    }

    function test_RevertIf_RevokeByNonIssuer() public {
        // Alice menerbitkan kredensial ke Bob
        vm.prank(alice);
        uint256 credId = profFound.issueCredential(bob, "Solidity Dev", sampleProofHash);

        // Charlie mencoba mencabut kredensial milik Alice
        vm.prank(charlie);
        vm.expectRevert(abi.encodeWithSelector(ProfFound.NotIssuer.selector, charlie, alice));
        profFound.revokeCredential(credId);
    }

    function test_RevertIf_RevokeNonExistent() public {
        // Mencoba mencabut kredensial yang belum ada
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ProfFound.CredentialNotFound.selector, 999));
        profFound.revokeCredential(999);
    }

    function test_RevertIf_AlreadyRevoked() public {
        // Alice menerbitkan kredensial ke Bob
        vm.prank(alice);
        uint256 credId = profFound.issueCredential(bob, "Solidity Dev", sampleProofHash);

        // Alice mencabut untuk pertama kali (sukses)
        vm.prank(alice);
        profFound.revokeCredential(credId);

        // Alice mencoba mencabut kembali kredensial yang sudah dicabut
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ProfFound.CredentialAlreadyRevoked.selector, credId));
        profFound.revokeCredential(credId);
    }

    // =============================================================
    //                       FUZZ TESTING
    // =============================================================

    function testFuzz_IssueCredential_ValidRecipients(address randomRecipient) public {
        // Exclude invalid addresses
        vm.assume(randomRecipient != address(0));
        vm.assume(randomRecipient != alice);

        vm.prank(alice);
        uint256 id = profFound.issueCredential(randomRecipient, "Verified Contributor", sampleProofHash);

        assertEq(id, 1);
        ProfFound.Credential memory cred = profFound.getCredential(id);
        assertEq(cred.recipient, randomRecipient);
    }
}
