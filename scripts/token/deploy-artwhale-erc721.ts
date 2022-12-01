import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC721 } from "../../typechain-types/contracts/token/ArtWhaleERC721";

const ARTWHALE_ERC721_NAME = process.env.ARTWHALE_ERC721_NAME || "";
const ARTWHALE_ERC721_SYMBOL = process.env.ARTWHALE_ERC721_SYMBOL || "";
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || "";
const ARTWHALE_ERC721_PROXY_UPGRADABLE_ADDRESS = process.env.ARTWHALE_ERC721_PROXY_UPGRADABLE_ADDRESS || "";

async function main() {

  const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");

  let token: Contract;

  if (ARTWHALE_ERC721_PROXY_UPGRADABLE_ADDRESS == "0x0000000000000000000000000000000000000000") {
    token = await upgrades.deployProxy(ArtWhaleERC721Factory, [
      ARTWHALE_ERC721_NAME,
      ARTWHALE_ERC721_SYMBOL,
      OPERATOR_ADDRESS,
      []
    ]) as ArtWhaleERC721;
    await token.deployed();
    console.log("ArtWhaleERC721 deployed to:", token.address);
  } else {
    token = await upgrades.upgradeProxy(ARTWHALE_ERC721_PROXY_UPGRADABLE_ADDRESS, ArtWhaleERC721Factory);
    console.log("ArtWhaleERC721 upgraded", ARTWHALE_ERC721_PROXY_UPGRADABLE_ADDRESS); 
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });