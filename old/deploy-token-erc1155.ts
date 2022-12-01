import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC1155Token } from "../../typechain-types/contracts/token/ERC1155Token";

const ARTWHALE_ERC1155_NAME = process.env.ARTWHALE_ERC1155_NAME || "";
const ARTWHALE_ERC1155_SYMBOL = process.env.ARTWHALE_ERC1155_SYMBOL || "";

async function main() {

  const ERC1155TokenFactory = await ethers.getContractFactory("ERC1155Token");

  const ERC1155Token = await ERC1155TokenFactory.deploy(
    ARTWHALE_ERC1155_NAME,
    ARTWHALE_ERC1155_SYMBOL
  ) as ERC1155Token;

  await tryVerify(ERC1155Token.address);

  console.log("ERC1155Token deployed: ", ERC1155Token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });