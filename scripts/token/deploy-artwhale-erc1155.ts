import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC1155 } from "../../typechain-types/contracts/token/ArtWhaleERC1155";

const ARTWHALE_ERC1155_NAME = process.env.ARTWHALE_ERC1155_NAME || "";
const ARTWHALE_ERC1155_SYMBOL = process.env.ARTWHALE_ERC1155_SYMBOL || "";
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || "";
const ARTWHALE_ERC1155_PROXY_UPGRADABLE_ADDRESS = process.env.ARTWHALE_ERC1155_PROXY_UPGRADABLE_ADDRESS || "";

async function main() {

  const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");

  let token: Contract;

  if (ARTWHALE_ERC1155_PROXY_UPGRADABLE_ADDRESS == "0x0000000000000000000000000000000000000000") {
    token = await upgrades.deployProxy(ArtWhaleERC1155Factory, [
      ARTWHALE_ERC1155_NAME,
      ARTWHALE_ERC1155_SYMBOL,
      "",
      OPERATOR_ADDRESS,
      []
    ]) as ArtWhaleERC1155;
    await token.deployed();
    console.log("ArtWhaleERC1155 deployed to:", token.address);
  } else {
    token = await upgrades.upgradeProxy(ARTWHALE_ERC1155_PROXY_UPGRADABLE_ADDRESS, ArtWhaleERC1155Factory);
    console.log("ArtWhaleERC1155 upgraded:", ARTWHALE_ERC1155_PROXY_UPGRADABLE_ADDRESS); 
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });