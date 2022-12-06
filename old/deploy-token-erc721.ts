import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC721Mock } from "../../typechain-types/contracts/token/ArtWhaleERC721Mock";

const ARTWHALE_ERC721_NAME = process.env.ARTWHALE_ERC721_NAME || "";
const ARTWHALE_ERC721_SYMBOL = process.env.ARTWHALE_ERC721_SYMBOL || "";

async function main() {

  const ArtWhaleERC721MockFactory = await ethers.getContractFactory("ArtWhaleERC721Mock");

  const erc721Token = await ArtWhaleERC721MockFactory.deploy(
    ARTWHALE_ERC721_NAME,
    ARTWHALE_ERC721_SYMBOL
  ) as ArtWhaleERC721Mock;

  await tryVerify(erc721Token.address);

  console.log("ArtWhaleERC721Mock deployed: ", erc721Token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });