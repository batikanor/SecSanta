// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ConfidentialFungibleToken} from "@openzeppelin/confidential-contracts/token/ConfidentialFungibleToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract ContributionPool is Ownable, SepoliaConfig {
    using FHE for *;

    ConfidentialFungibleToken public immutable token;

    error PoolTokenTransferFailed(bytes reason);

    struct Pool {
        string name;
        address creator;
        address recipient;
        euint64 totalEnc; // encrypted total
        uint256 totalPlain; // plain total, only set after decryption
        uint256 minContributors;
        string latestGiftSuggestion;
        uint256 contributorCount;
        bool finalized;
    }

    uint256 public nextPoolId;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => bytes32) public poolTotalHandle;
    mapping(uint256 => mapping(address => bool)) public hasContributed;
    mapping(uint256 => uint256) private _requestToPool;

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string name,
        address indexed recipient,
        uint256 minContributors,
        string giftSuggestion
    );
    event ContributionMade(uint256 indexed poolId, address indexed contributor, string giftSuggestion);
    event PoolFinalizeRequested(
        uint256 indexed poolId,
        address indexed creator,
        address indexed recipient,
        bytes32 encryptedTotalHandle
    );
    event PoolFinalized(uint256 indexed poolId, address indexed creator, address indexed recipient, uint256 totalPlain);

    constructor(ConfidentialFungibleToken _token) Ownable(msg.sender) {
        require(address(_token) != address(0), "Invalid token");
        token = _token;
        nextPoolId = 1;
    }

    function createPool(
        string calldata name_,
        address recipient_,
        uint256 minContributors_,
        string calldata giftSuggestion_,
        externalEuint64 encryptedContribution,
        bytes calldata contributionProof
    ) external returns (uint256 poolId) {
        require(recipient_ != address(0), "Invalid recipient");
        require(minContributors_ > 0, "minContributors must be >0");

        poolId = nextPoolId++;
        pools[poolId] = Pool({
            name: name_,
            creator: msg.sender,
            recipient: recipient_,
            totalEnc: FHE.asEuint64(0),
            totalPlain: 0,
            minContributors: minContributors_,
            latestGiftSuggestion: giftSuggestion_,
            contributorCount: 0,
            finalized: false
        });

        Pool storage p = pools[poolId];
        _addContribution(poolId, p, msg.sender, encryptedContribution, contributionProof, giftSuggestion_);

        pools[poolId].totalEnc = FHE.makePubliclyDecryptable(pools[poolId].totalEnc);

        emit PoolCreated(poolId, msg.sender, name_, recipient_, minContributors_, giftSuggestion_);
    }

    function contribute(
        uint256 poolId,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        string calldata giftSuggestion_
    ) external {
        Pool storage p = pools[poolId];
        require(p.creator != address(0), "Pool not found");
        require(!p.finalized, "Pool already finalized");
        require(!hasContributed[poolId][msg.sender], "Already contributed");

        _addContribution(poolId, p, msg.sender, encryptedAmount, inputProof, giftSuggestion_);
    }

    function finalize(uint256 poolId) external {
        Pool storage p = pools[poolId];
        require(p.creator != address(0), "Pool not found");
        require(!p.finalized, "Already finalized");
        require(msg.sender == p.creator, "Only pool creator can finalize");
        require(p.contributorCount >= p.minContributors, "Not enough contributors");

        p.finalized = true;

        euint64 payout = p.totalEnc;
        payout = FHE.allowThis(payout);
        payout = FHE.allow(payout, address(token));

        euint64 transferred;
        try token.confidentialTransfer(p.recipient, payout) returns (euint64 value) {
            transferred = value;
        } catch (bytes memory revertData) {
            revert PoolTokenTransferFailed(revertData);
        }

        transferred = FHE.allowThis(transferred);
        transferred = FHE.makePubliclyDecryptable(transferred);

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = euint64.unwrap(transferred);

        uint256 requestId = FHE.requestDecryption(cts, this._callbackRevealTotal.selector);
        _requestToPool[requestId] = poolId;
        poolTotalHandle[poolId] = cts[0];

        p.totalEnc = FHE.allowThis(FHE.asEuint64(0));

        emit PoolFinalizeRequested(poolId, p.creator, p.recipient, cts[0]);
    }

    function _callbackRevealTotal(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) external {
        uint256 poolId = _requestToPool[requestId];
        require(poolId != 0, "Invalid request");
        delete _requestToPool[requestId];

        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        uint64 plain = abi.decode(cleartexts, (uint64));
        Pool storage p = pools[poolId];
        p.totalPlain = plain;

        emit PoolFinalized(poolId, p.creator, p.recipient, plain);
    }

    function getPool(
        uint256 poolId
    )
        external
        view
        returns (
            string memory name,
            address creator,
            address recipient,
            uint256 totalPlain,
            uint256 minContributors,
            string memory giftSuggestion,
            uint256 contributorCount,
            bool finalized
        )
    {
        Pool memory p = pools[poolId];
        return (
            p.name,
            p.creator,
            p.recipient,
            p.totalPlain,
            p.minContributors,
            p.latestGiftSuggestion,
            p.contributorCount,
            p.finalized
        );
    }

    function _addContribution(
        uint256 poolId,
        Pool storage p,
        address contributor,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        string calldata giftSuggestion_
    ) private {
        require(token.isOperator(contributor, address(this)), "Pool: contract not operator");

        p.totalEnc = FHE.allowThis(p.totalEnc);

        euint64 amountEnc = encryptedAmount.fromExternal(inputProof);

        amountEnc = FHE.allowThis(amountEnc);
        amountEnc = FHE.allow(amountEnc, address(token));

        euint64 transferred = token.confidentialTransferFrom(contributor, address(this), amountEnc);
        transferred = FHE.allowThis(transferred);

        euint64 newTotal = FHE.add(p.totalEnc, transferred);
        newTotal = FHE.allowThis(newTotal);
        newTotal = FHE.makePubliclyDecryptable(newTotal);
        p.totalEnc = newTotal;

        p.contributorCount += 1;
        hasContributed[poolId][contributor] = true;

        if (bytes(giftSuggestion_).length > 0) {
            p.latestGiftSuggestion = giftSuggestion_;
        }

        emit ContributionMade(poolId, contributor, giftSuggestion_);
    }
}
