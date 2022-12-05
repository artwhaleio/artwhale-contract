import { ethers } from "hardhat";
import { tryVerify } from "../helpers/tryVerify";
import { ArtWhaleFactoryV1 } from "../typechain-types/contracts/ArtWhaleFactoryV1";

async function main() {

  const ArtWhaleFactoryV1Factory = await ethers.getContractFactory("ArtWhaleFactoryV1");

  const artWhaleFactoryV1 = await ArtWhaleFactoryV1Factory.deploy() as ArtWhaleFactoryV1;

  console.log("ArtWhaleFactoryV1 deployed: ", artWhaleFactoryV1.address);

  await new Promise(r => setTimeout(r, 10000));
  
  await tryVerify(artWhaleFactoryV1.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });