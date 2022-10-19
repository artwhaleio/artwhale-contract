import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC1155Token } from "../../typechain-types/contracts/token/ERC1155Token";

const ERC1155_TOKEN_NAME = process.env.ERC1155_TOKEN_NAME || "";
const ERC1155_TOKEN_SYMBOL = process.env.ERC1155_TOKEN_SYMBOL || "";

async function main() {

  const ERC1155TokenFactory = await ethers.getContractFactory("ERC1155Token");

  const ERC1155Token = await ERC1155TokenFactory.deploy(
    ERC1155_TOKEN_NAME,
    ERC1155_TOKEN_SYMBOL
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