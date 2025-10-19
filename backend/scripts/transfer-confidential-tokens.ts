import { ethers, network } from "hardhat";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import path from "path";
import { readFileSync } from "fs";

/**
 * Simple CLI helper to transfer confidential tokens using the zk-relayer.
 *
 * Usage:
 *   RECIPIENT=0x... AMOUNT=1 npx hardhat run scripts/transfer-confidential-tokens.ts --network sepolia
 *
 * Environment variables:
 *   RECIPIENT  - target address (checksummed).
 *   AMOUNT     - token amount in human-readable units (defaults to 18 decimals).
 *   TOKEN_ADDRESS (optional) - override token address in case the local JSON is outdated.
 *   RPC_URL    (optional) - override RPC URL sent to the relayer SDK (falls back to Hardhat network url).
 */

const DEPLOYMENT_JSON = "../../fe/contracts/zama-deployment.json";
const TOKEN_DECIMALS = 6;

function loadDeploymentTokenAddress(): string | undefined {
  try {
    const absolute = path.resolve(__dirname, DEPLOYMENT_JSON);
    const raw = readFileSync(absolute, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.token?.address;
  } catch {
    return undefined;
  }
}

async function main() {
  const recipient = process.env.RECIPIENT;
  const amountInput = process.env.AMOUNT;

  if (!recipient || !ethers.isAddress(recipient)) {
    throw new Error("Please provide a valid RECIPIENT address (e.g. RECIPIENT=0xabc...)");
  }

  if (!amountInput) {
    throw new Error("Please provide AMOUNT in token units (e.g. AMOUNT=1.5)");
  }

  const tokenAddress = process.env.TOKEN_ADDRESS ?? loadDeploymentTokenAddress();
  if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
    throw new Error("Unable to resolve token address. Set TOKEN_ADDRESS or update fe/contracts/zama-deployment.json");
  }

  const amount = ethers.parseUnits(amountInput, TOKEN_DECIMALS);

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  console.log(`🔐 Using signer ${signerAddress}`);
  console.log(`🎯 Recipient: ${recipient}`);
  console.log(`🪙 Amount (wei): ${amount.toString()}`);
  console.log(`🎁 Token: ${tokenAddress}`);

  const fhevm = await createInstance({
    ...SepoliaConfig,
    network: process.env.RPC_URL ?? (network.config as any)?.url ?? SepoliaConfig.network,
  });

  const encryptedInputBuilder = fhevm.createEncryptedInput(tokenAddress, signerAddress);
  encryptedInputBuilder.add64(amount);
  const encryptedInput = await encryptedInputBuilder.encrypt();

  const encryptedHandle = ethers.hexlify(encryptedInput.handles[0]);
  const proofBytes = ethers.hexlify(encryptedInput.inputProof);

  const token = await ethers.getContractAt("BirthdayConfidentialToken", tokenAddress, signer);

  console.log("🚀 Submitting confidential transfer transaction...");
  const tx = await token["confidentialTransfer(address,bytes32,bytes)"](
    recipient,
    encryptedHandle,
    proofBytes
  );
  const receipt = await tx.wait();

  console.log("✅ Transfer confirmed");
  console.log(`   Tx hash: ${receipt.hash}`);
  console.log(`   Block #: ${receipt.blockNumber}`);
}

main().catch((error) => {
  console.error("❌ Failed to transfer confidential tokens");
  console.error(error);
  process.exitCode = 1;
});
