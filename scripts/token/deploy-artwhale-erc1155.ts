import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC1155 } from "../../typechain-types/contracts/token/ArtWhaleERC1155";

const ERC1155_TOKEN_NAME = process.env.ERC1155_TOKEN_NAME || "";
const ERC1155_TOKEN_SYMBOL = process.env.ERC1155_TOKEN_SYMBOL || "";
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS || "";

async function main() {

  const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");

  const ArtWhaleERC1155 = await ArtWhaleERC1155Factory.deploy(
    ERC1155_TOKEN_NAME,
    ERC1155_TOKEN_SYMBOL,
    "",
    OPERATOR_ADDRESS
  ) as ArtWhaleERC1155;

  await tryVerify(ArtWhaleERC1155.address);

  console.log("ArtWhaleERC1155 deployed: ", ArtWhaleERC1155.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });