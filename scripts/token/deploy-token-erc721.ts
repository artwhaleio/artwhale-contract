import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC721Mock } from "../../typechain-types/contracts/token/ArtWhaleERC721Mock";

const ERC721_TOKEN_NAME = process.env.ERC721_TOKEN_NAME || "";
const ERC721_TOKEN_SYMBOL = process.env.ERC721_TOKEN_SYMBOL || "";

async function main() {

  const ArtWhaleERC721MockFactory = await ethers.getContractFactory("ArtWhaleERC721Mock");

  const erc721Token = await ArtWhaleERC721MockFactory.deploy(
    ERC721_TOKEN_NAME,
    ERC721_TOKEN_SYMBOL
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