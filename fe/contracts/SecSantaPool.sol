// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecSantaPool
 * @notice Smart contract for privacy-preserving Secret Santa gift pools
 * @dev Integrates with iExec DataProtector for encrypted contributions
 *
 * Flow:
 * 1. Contributors send ETH + store protected data address (from iExec DataProtector)
 * 2. Pool creator finalizes pool with TEE computation proof
 * 3. Contract transfers total amount to recipient
 */
contract SecSantaPool {

    struct Pool {
        address creator;
        address payable recipient;
        uint256 totalContributions;
        uint256 contributorCount;
        bool finalized;
        bool exists;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        string protectedDataAddress; // iExec DataProtector NFT address
        uint256 timestamp;
    }

    // Mapping from pool ID to Pool data
    mapping(bytes32 => Pool) public pools;

    // Mapping from pool ID to array of contributions
    mapping(bytes32 => Contribution[]) public contributions;

    // Mapping to track if an address has contributed to a pool
    mapping(bytes32 => mapping(address => bool)) public hasContributed;

    // Events
    event PoolCreated(
        bytes32 indexed poolId,
        address indexed creator,
        address indexed recipient,
        uint256 timestamp
    );

    event ContributionAdded(
        bytes32 indexed poolId,
        address indexed contributor,
        uint256 amount,
        string protectedDataAddress,
        uint256 timestamp
    );

    event PoolFinalized(
        bytes32 indexed poolId,
        address indexed recipient,
        uint256 totalAmount,
        uint256 timestamp
    );

    /**
     * @notice Create a new gift pool
     * @param poolId Unique identifier for the pool
     * @param recipient Address that will receive the pooled funds
     */
    function createPool(
        bytes32 poolId,
        address payable recipient
    ) external payable {
        require(!pools[poolId].exists, "Pool already exists");
        require(recipient != address(0), "Invalid recipient");

        pools[poolId] = Pool({
            creator: msg.sender,
            recipient: recipient,
            totalContributions: msg.value,
            contributorCount: 0,
            finalized: false,
            exists: true
        });

        // If creator contributed during creation
        if (msg.value > 0) {
            pools[poolId].contributorCount = 1;
            hasContributed[poolId][msg.sender] = true;
        }

        emit PoolCreated(poolId, msg.sender, recipient, block.timestamp);
    }

    /**
     * @notice Contribute to an existing pool with encrypted amount
     * @param poolId ID of the pool to contribute to
     * @param protectedDataAddress Address of the encrypted contribution data (iExec NFT)
     */
    function contribute(
        bytes32 poolId,
        string memory protectedDataAddress
    ) external payable {
        require(pools[poolId].exists, "Pool does not exist");
        require(!pools[poolId].finalized, "Pool already finalized");
        require(msg.value > 0, "Contribution must be greater than 0");
        require(!hasContributed[poolId][msg.sender], "Already contributed to this pool");

        Pool storage pool = pools[poolId];
        pool.totalContributions += msg.value;
        pool.contributorCount++;
        hasContributed[poolId][msg.sender] = true;

        contributions[poolId].push(Contribution({
            contributor: msg.sender,
            amount: msg.value,
            protectedDataAddress: protectedDataAddress,
            timestamp: block.timestamp
        }));

        emit ContributionAdded(
            poolId,
            msg.sender,
            msg.value,
            protectedDataAddress,
            block.timestamp
        );
    }

    /**
     * @notice Add creator's contribution with protected data address
     * @dev Used when creator contributes after pool creation with encryption
     * @param poolId ID of the pool
     * @param protectedDataAddress Address of the encrypted contribution data
     */
    function addCreatorContribution(
        bytes32 poolId,
        string memory protectedDataAddress
    ) external {
        require(pools[poolId].exists, "Pool does not exist");
        require(msg.sender == pools[poolId].creator, "Only creator can call this");
        require(!pools[poolId].finalized, "Pool already finalized");

        // Add the creator's contribution metadata
        contributions[poolId].push(Contribution({
            contributor: msg.sender,
            amount: 0, // Amount already in contract from createPool
            protectedDataAddress: protectedDataAddress,
            timestamp: block.timestamp
        }));

        emit ContributionAdded(
            poolId,
            msg.sender,
            0,
            protectedDataAddress,
            block.timestamp
        );
    }

    /**
     * @notice Finalize pool and transfer funds to recipient
     * @dev In full implementation, would verify TEE computation proof
     * @param poolId ID of the pool to finalize
     */
    function finalizePool(bytes32 poolId) external {
        Pool storage pool = pools[poolId];

        require(pool.exists, "Pool does not exist");
        require(!pool.finalized, "Pool already finalized");
        require(msg.sender == pool.creator, "Only creator can finalize");
        require(pool.totalContributions > 0, "No contributions to transfer");

        uint256 amount = pool.totalContributions;
        pool.finalized = true;

        // Transfer funds to recipient
        (bool success, ) = pool.recipient.call{value: amount}("");
        require(success, "Transfer failed");

        emit PoolFinalized(poolId, pool.recipient, amount, block.timestamp);
    }

    /**
     * @notice Get pool information
     */
    function getPool(bytes32 poolId) external view returns (
        address creator,
        address recipient,
        uint256 totalContributions,
        uint256 contributorCount,
        bool finalized
    ) {
        Pool storage pool = pools[poolId];
        require(pool.exists, "Pool does not exist");

        return (
            pool.creator,
            pool.recipient,
            pool.totalContributions,
            pool.contributorCount,
            pool.finalized
        );
    }

    /**
     * @notice Get all contribution data for a pool
     * @dev Returns protected data addresses for TEE computation
     */
    function getContributions(bytes32 poolId) external view returns (
        Contribution[] memory
    ) {
        require(pools[poolId].exists, "Pool does not exist");
        return contributions[poolId];
    }

    /**
     * @notice Get protected data addresses for iApp computation
     */
    function getProtectedDataAddresses(bytes32 poolId) external view returns (
        string[] memory
    ) {
        require(pools[poolId].exists, "Pool does not exist");

        Contribution[] storage poolContributions = contributions[poolId];
        string[] memory addresses = new string[](poolContributions.length);

        for (uint256 i = 0; i < poolContributions.length; i++) {
            addresses[i] = poolContributions[i].protectedDataAddress;
        }

        return addresses;
    }
}
