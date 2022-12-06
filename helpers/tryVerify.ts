import hre from "hardhat";

async function tryVerify(contractAddress: string, constructorArgs?: any) {
    console.log("\n")
    await new Promise(r => setTimeout(r, 3000));
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: constructorArgs,
      });
      console.log(`Verification of ${contractAddress} success\n`);
    } catch (error) {
      console.log(`Verification of ${contractAddress} failed\n`);
      console.log("\n\n")
    }
  }

export {tryVerify}