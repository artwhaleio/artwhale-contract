import hre from "hardhat";
import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleMarketplace } from "../../typechain-types/contracts/ArtWhaleMarketplace";

const MARKETPLACE_PROXY_UPGRADABLE_ADDRESS = process.env.MARKETPLACE_PROXY_UPGRADABLE_ADDRESS || "";

async function main() {

  const ArtWhaleMarketplaceFactory = await ethers.getContractFactory("ArtWhaleMarketplace");
  const artWhaleMarketplace = await ArtWhaleMarketplaceFactory.attach(MARKETPLACE_PROXY_UPGRADABLE_ADDRESS) as ArtWhaleMarketplace;

  await artWhaleMarketplace.setTradeFeePercent(0);
  await artWhaleMarketplace.addToWhitelistErc721("0xF412D1eFDDB3781502711c74a950DC89d76fc9dE");
  await artWhaleMarketplace.addToWhitelistErc1155("0xD4e4Ad77fF9733Cc5D612D3Df3A0868616d30C7c");

  console.log("job done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });