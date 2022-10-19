async function tryVerify(contractAddress, constructorArgs) {
    console.log("\n")
    try {
      console.log(constructorArgs)
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: constructorArgs,
      });
      console.log(`Verification of ${contractAddress} success\n`);
    } catch (error) {
      console.log(`Verification of ${contractAddress} failed\n`);
      console.log(error);
      console.log("\n\n")
    }
  }

module.exports = {tryVerify}