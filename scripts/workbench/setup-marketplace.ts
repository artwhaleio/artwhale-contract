import hre from "hardhat";
import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleMarketplace } from "../../typechain-types/contracts/ArtWhaleMarketplace";

const MARKETPLACE_PROXY_UPGRADABLE_ADDRESS = process.env.MARKETPLACE_PROXY_UPGRADABLE_ADDRESS || "";

async function main() {

  const ArtWhaleMarketplaceFactory = await ethers.getContractFactory("ArtWhaleMarketplace");
  const artWhaleMarketplace = await ArtWhaleMarketplaceFactory.attach(MARKETPLACE_PROXY_UPGRADABLE_ADDRESS) as ArtWhaleMarketplace;

  await artWhaleMarketplace.setTradeFeePercent(0);
  await artWhaleMarketplace.addToWhitelistErc721("");
  await artWhaleMarketplace.addToWhitelistErc1155("");

  console.log("job done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });