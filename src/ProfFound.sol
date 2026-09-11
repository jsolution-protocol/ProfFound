// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProfFound
 * @author Azfa & Antigravity
 * @notice Smart contract for on-chain Verifiable Credentials and Professional Reputation.
 * @dev Enables authorized entities (Issuers) to issue verifiable credentials to professionals (Recipients).
 */
contract ProfFound {

    // =============================================================
    //                           ENUMS
    // =============================================================

    /**
     * @notice Status lifecycle of a credential.
     * @dev 'None' is the default value (0) to prevent uninitialized queries from being considered valid.
     */
    enum CredentialStatus {
        None,
        Valid,
        Revoked
    }

    // =============================================================
    //                          STRUCTS
    // =============================================================

    /**
     * @notice Core data structure representing an issued credential.
     * @param id Unique credential identifier.
     * @param issuer Wallet address that issued the credential.
     * @param recipient Wallet address of the professional receiving the credential.
     * @param credentialType Type/title of credential (e.g., "Solidity Developer", "Hackathon Winner").
     * @param issuedAt Block timestamp when the credential was created.
     * @param status Current status of the credential (Valid or Revoked).
     * @param proofHash Cryptographic hash (e.g. SHA-256 of off-chain metadata or IPFS CID) as proof.
     */
    struct Credential {
        uint256 id;
        address issuer;
        address recipient;
        string credentialType;
        uint256 issuedAt;
        CredentialStatus status;
        bytes32 proofHash;
    }

    // =============================================================
    //                       CUSTOM ERRORS
    // =============================================================

    /// @notice Thrown when attempting to issue a credential to address(0).
    error InvalidRecipient();

    /// @notice Thrown when an issuer attempts to issue a credential to their own wallet.
    error SelfIssuanceNotAllowed();

    /// @notice Thrown when credential type string is empty.
    error EmptyCredentialType();

    /// @notice Thrown when querying a non-existent credential.
    error CredentialNotFound(uint256 id);

    /// @notice Thrown when a non-issuer tries to perform restricted action (like revoke).
    error NotIssuer(address caller, address issuer);

    // =============================================================
    //                           EVENTS
    // =============================================================

    /**
     * @notice Emitted when a new credential is successfully issued on-chain.
     * @param id Unique identifier of the credential.
     * @param issuer Address of the issuer who signed/created the transaction.
     * @param recipient Address of the professional receiving the credential.
     * @param credentialType Title or domain of the credential.
     * @param issuedAt Timestamp when issued.
     * @param proofHash Proof hash associated with the credential.
     */
    event CredentialIssued(
        uint256 indexed id,
        address indexed issuer,
        address indexed recipient,
        string credentialType,
        uint256 issuedAt,
        bytes32 proofHash
    );

    // =============================================================
    //                      STATE VARIABLES
    // =============================================================

    /// @dev Counter for generating unique auto-incrementing credential IDs.
    uint256 private _credentialIdCounter;

    /// @dev Mapping from credential ID to Credential details.
    mapping(uint256 => Credential) private _credentials;

    /// @dev Mapping from recipient address to array of their credential IDs.
    mapping(address => uint256[]) private _recipientCredentials;

    // =============================================================
    //                     EXTERNAL FUNCTIONS
    // =============================================================

    /**
     * @notice Issues a new verifiable credential to a professional.
     * @dev Uses `calldata` for `credentialType` to save gas by avoiding memory allocation.
     * @param recipient Wallet address of the professional receiving the credential.
     * @param credentialType String describing the credential (e.g. "Junior Solidity Developer").
     * @param proofHash bytes32 hash of supporting evidence (e.g. IPFS digest or certificate hash).
     * @return newId The newly assigned unique credential ID.
     */
    function issueCredential(
        address recipient,
        string calldata credentialType,
        bytes32 proofHash
    ) external returns (uint256 newId) {
        // 1. Validasi Input
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }

        if (recipient == msg.sender) {
            revert SelfIssuanceNotAllowed();
        }

        if (bytes(credentialType).length == 0) {
            revert EmptyCredentialType();
        }

        // 2. State Mutation
        _credentialIdCounter++;
        newId = _credentialIdCounter;

        _credentials[newId] = Credential({
            id: newId,
            issuer: msg.sender,
            recipient: recipient,
            credentialType: credentialType,
            issuedAt: block.timestamp,
            status: CredentialStatus.Valid,
            proofHash: proofHash
        });

        _recipientCredentials[recipient].push(newId);

        // 3. Emit Event
        emit CredentialIssued(
            newId,
            msg.sender,
            recipient,
            credentialType,
            block.timestamp,
            proofHash
        );
    }

    // =============================================================
    //                       VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Retrieves full details of a credential by its ID.
     * @param id The unique ID of the credential.
     * @return The Credential struct.
     */
    function getCredential(uint256 id) external view returns (Credential memory) {
        if (_credentials[id].status == CredentialStatus.None) {
            revert CredentialNotFound(id);
        }
        return _credentials[id];
    }

    /**
     * @notice Returns all credential IDs belonging to a specific recipient.
     * @param recipient The wallet address of the professional.
     * @return Array of credential IDs.
     */
    function getCredentialsByRecipient(address recipient) external view returns (uint256[] memory) {
        return _recipientCredentials[recipient];
    }

    /**
     * @notice Returns total number of credentials issued across the platform.
     * @return Total count of credentials.
     */
    function totalCredentials() external view returns (uint256) {
        return _credentialIdCounter;
    }
}
