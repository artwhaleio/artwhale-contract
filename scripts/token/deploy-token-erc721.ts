import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC721Token } from "../../typechain-types/contracts/token/ERC721Token";

const ERC721_TOKEN_NAME = process.env.ERC721_TOKEN_NAME || "";
const ERC721_TOKEN_SYMBOL = process.env.ERC721_TOKEN_SYMBOL || "";

async function main() {

  const ERC721TokenFactory = await ethers.getContractFactory("ERC721Token");

  const erc721Token = await ERC721TokenFactory.deploy(
    ERC721_TOKEN_NAME,
    ERC721_TOKEN_SYMBOL
  ) as ERC721Token;

  await tryVerify(erc721Token.address);

  console.log("ERC721Token deployed: ", erc721Token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });