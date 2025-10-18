/**
 * SecSanta Pool Total Computation iApp
 *
 * This application runs inside iExec's Trusted Execution Environment (TEE)
 * to compute the total of encrypted contributions without revealing individual amounts.
 *
 * Input: Array of protected data addresses (iExec DataProtector NFTs)
 * Output: Total amount (without individual amounts)
 */

const { IExecDataProtectorSharing } = require('@iexec/dataprotector');
const fsPromises = require('fs').promises;

/**
 * Main computation function
 * Runs inside TEE with access to decrypted data
 */
async function computePoolTotal() {
  try {
    console.log('🔐 Starting TEE computation for SecSanta pool...');

    // Read input parameters (protected data addresses)
    const iexecIn = process.env.IEXEC_IN;
    const inputData = JSON.parse(
      await fsPromises.readFile(`${iexecIn}/iexec_in.json`, 'utf8')
    );

    const protectedDataAddresses = inputData.protectedDataAddresses;
    console.log(`📦 Received ${protectedDataAddresses.length} protected data addresses`);

    // Initialize DataProtector for sharing (to access protected data)
    const dataProtectorSharing = new IExecDataProtectorSharing(
      process.env.IEXEC_REQUESTER_SECRET_1 // App secret
    );

    let total = 0;
    const contributorDetails = [];

    // Process each protected data NFT
    for (let i = 0; i < protectedDataAddresses.length; i++) {
      const address = protectedDataAddresses[i];
      console.log(`🔓 Decrypting contribution ${i + 1}/${protectedDataAddresses.length}...`);

      try {
        // Fetch and decrypt the protected data inside TEE
        // This is the KEY OPERATION - decryption happens in secure enclave
        const protectedData = await dataProtectorSharing.fetchProtectedData({
          protectedData: address,
        });

        // Extract contribution data
        const contribution = JSON.parse(protectedData.data);
        const amount = parseFloat(contribution.amount);

        console.log(`  ✅ Decrypted contribution from ${contribution.contributorAddress.slice(0, 8)}...`);

        // Add to total (computation inside TEE)
        total += amount;

        // Store contributor (without revealing amount)
        contributorDetails.push({
          address: contribution.contributorAddress,
          timestamp: contribution.timestamp,
          // NOTE: Individual amount NOT included in output
        });

      } catch (error) {
        console.error(`  ❌ Failed to decrypt contribution ${i + 1}:`, error.message);
        // Continue with other contributions
      }
    }

    console.log(`💰 Total computed: ${total} ETH (individual amounts remain private)`);

    // Prepare output
    const result = {
      totalAmount: total.toString(),
      contributorCount: contributorDetails.length,
      contributors: contributorDetails, // Without individual amounts
      computedAt: new Date().toISOString(),
      teeEnvironment: 'iExec SGX',
    };

    // Write result to output directory
    const iexecOut = process.env.IEXEC_OUT;
    await fsPromises.writeFile(
      `${iexecOut}/computed-result.json`,
      JSON.stringify(result, null, 2)
    );

    // Also write a deterministic output for the smart contract
    await fsPromises.writeFile(
      `${iexecOut}/result.txt`,
      total.toString()
    );

    console.log('✅ TEE computation completed successfully!');
    console.log(`   Total: ${total} ETH`);
    console.log(`   Contributors: ${contributorDetails.length}`);
    console.log('   Individual amounts: PRIVATE (never revealed)');

    return result;

  } catch (error) {
    console.error('❌ TEE computation failed:', error);

    // Write error to output
    const iexecOut = process.env.IEXEC_OUT;
    await fsPromises.writeFile(
      `${iexecOut}/error.json`,
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }, null, 2)
    );

    throw error;
  }
}

// Run the computation
computePoolTotal()
  .then(() => {
    console.log('🎉 iApp execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 iApp execution failed:', error);
    process.exit(1);
  });
