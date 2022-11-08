import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC721 } from "../../typechain-types/contracts/token/ArtWhaleERC721";

const ERC721_TOKEN_NAME = process.env.ERC721_TOKEN_NAME || "";
const ERC721_TOKEN_SYMBOL = process.env.ERC721_TOKEN_SYMBOL || "";
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || "";

async function main() {

  const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");

  const ArtWhaleERC721 = await ArtWhaleERC721Factory.deploy(
    ERC721_TOKEN_NAME,
    ERC721_TOKEN_SYMBOL,
    OPERATOR_ADDRESS
  ) as ArtWhaleERC721;

  await tryVerify(ArtWhaleERC721.address);

  console.log("ArtWhaleERC721 deployed: ", ArtWhaleERC721.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });