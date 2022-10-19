import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC20Token } from "../../typechain-types/contracts/token/ERC20Token";

const ERC20_TOKEN_NAME = process.env.ERC20_TOKEN_NAME || "";
const ERC20_TOKEN_SYMBOL = process.env.ERC20_TOKEN_SYMBOL || "";

async function main() {

  const ERC20TokenFactory = await ethers.getContractFactory("ERC20Token");

  const erc20Token = await ERC20TokenFactory.deploy(
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL
  ) as ERC20Token;

  await tryVerify(erc20Token.address);

  console.log("ERC20Token deployed: ", erc20Token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });