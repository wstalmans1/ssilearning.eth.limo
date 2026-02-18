import hre from "hardhat"
import fs from "fs"

async function main() {
  const address = process.argv[2]
  const stdJsonPath = process.argv[3]
  const contractFullyQualifiedName = process.argv[4] // e.g. contracts/My.sol:My
  if (!address || !stdJsonPath || !contractFullyQualifiedName) {
    throw new Error("Usage: ts-node scripts/verify-stdjson.ts <address> <standardJsonPath> <FQN>")
  }

  const standardJsonInput = fs.readFileSync(stdJsonPath, "utf8")

  console.log("Verifying on Blockscout (submits to Sourcify)…")
  try {
    await hre.run("verify:verify", {
      address,
      contract: contractFullyQualifiedName,
      constructorArguments: [],
      libraries: {},
      standardJsonInput,
      network: "sepolia-blockscout",
    })
    console.log("✅ Blockscout verified via standard JSON input (also available on Sourcify)")
  } catch (e: any) {
    console.log("❌ Blockscout failed:", e.message || e)
    throw e
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
