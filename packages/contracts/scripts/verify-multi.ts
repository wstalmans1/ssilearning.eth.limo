import hre from "hardhat"

async function main() {
  const address = process.argv[2]
  if (!address) throw new Error("Usage: ts-node scripts/verify-multi.ts <address> [constructorArgsJson]")

  const argsJson = process.argv[3]
  const constructorArgs: any[] = argsJson ? JSON.parse(argsJson) : []

  console.log("Verifying on Blockscout (submits to Sourcify)…")
  try {
    await hre.run("verify:verify", { address, network: "sepolia-blockscout", constructorArguments: constructorArgs })
    console.log("✅ Blockscout verified (also available on Sourcify)")
  } catch (e: any) {
    console.log("❌ Blockscout failed:", e.message || e)
    throw e
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
