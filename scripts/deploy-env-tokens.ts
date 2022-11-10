import { ethers } from "hardhat";
import { tryVerify } from "../helpers/tryVerify";
import { ArtWhaleERC721 } from "../typechain-types/contracts/token/ArtWhaleERC721";
import { ArtWhaleERC1155 } from "../typechain-types/contracts/token/ArtWhaleERC1155";

const ERC721_TOKEN_NAME = process.env.ERC721_TOKEN_NAME || "";
const ERC721_TOKEN_SYMBOL = process.env.ERC721_TOKEN_SYMBOL || "";
const ERC1155_TOKEN_NAME = process.env.ERC1155_TOKEN_NAME || "";
const ERC1155_TOKEN_SYMBOL = process.env.ERC1155_TOKEN_SYMBOL || "";
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || "";

async function main() {
// TODO ADD VERIFY ARGS
  console.log("deploy ArtWhaleERC721...");
  const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");
  const ArtWhaleERC721 = await ArtWhaleERC721Factory.deploy(
    ERC721_TOKEN_NAME,
    ERC721_TOKEN_SYMBOL,
    OPERATOR_ADDRESS
  ) as ArtWhaleERC721;
  console.log("ArtWhaleERC721 deployed: ", ArtWhaleERC721.address);
  await tryVerify(ArtWhaleERC721.address);

  console.log("deploy ArtWhaleERC1155...");
  const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");
  const ArtWhaleERC1155 = await ArtWhaleERC1155Factory.deploy(
    ERC1155_TOKEN_NAME,
    ERC1155_TOKEN_SYMBOL,
    "",
    OPERATOR_ADDRESS
  ) as ArtWhaleERC1155;
  console.log("ArtWhaleERC1155 deployed: ", ArtWhaleERC1155.address);
  await tryVerify(ArtWhaleERC1155.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });