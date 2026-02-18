import hre from "hardhat"

async function main() {
  const proxyAddress = process.argv[2]
  if (!proxyAddress) throw new Error("Usage: ts-node scripts/verify-upgradeable.ts <proxyAddress>")

  try {
    await hre.run("verify:verify", { address: proxyAddress, network: "sepolia-blockscout" })
    console.log("✅ Verified proxy on Blockscout (also available on Sourcify)")
  } catch (e: any) {
    console.log("❌ Proxy verification failed:", e.message || e)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
