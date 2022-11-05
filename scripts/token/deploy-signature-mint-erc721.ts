import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC721SignatureMint } from "../../typechain-types/contracts/token/ERC721SignatureMint";

const ERC721_TOKEN_NAME = process.env.ERC721_TOKEN_NAME || "";
const ERC721_TOKEN_SYMBOL = process.env.ERC721_TOKEN_SYMBOL || "";

async function main() {

  const ERC721SignatureMintFactory = await ethers.getContractFactory("ERC721SignatureMint");

  const ERC721SignatureMint = await ERC721SignatureMintFactory.deploy(
    ERC721_TOKEN_NAME,
    ERC721_TOKEN_SYMBOL
  ) as ERC721SignatureMint;

  await tryVerify(ERC721SignatureMint.address);

  console.log("ERC721SignatureMint deployed: ", ERC721SignatureMint.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });