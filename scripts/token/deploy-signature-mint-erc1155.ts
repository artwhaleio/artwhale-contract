import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC1155SignatureMint } from "../../typechain-types/contracts/token/ERC1155SignatureMint";

const ERC1155_TOKEN_NAME = process.env.ERC1155_TOKEN_NAME || "";
const ERC1155_TOKEN_SYMBOL = process.env.ERC1155_TOKEN_SYMBOL || "";

async function main() {

  const ERC1155SignatureMintFactory = await ethers.getContractFactory("ERC1155SignatureMint");

  const ERC1155SignatureMint = await ERC1155SignatureMintFactory.deploy(
    ERC1155_TOKEN_NAME,
    ERC1155_TOKEN_SYMBOL
  ) as ERC1155SignatureMint;

  await tryVerify(ERC1155SignatureMint.address);

  console.log("ERC1155SignatureMint deployed: ", ERC1155SignatureMint.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });