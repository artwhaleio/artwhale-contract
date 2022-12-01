import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ERC20TokenMock } from "../../typechain-types/contracts/mocks/ERC20TokenMockMock";

const ERC20_TOKEN_NAME = process.env.ERC20_TOKEN_NAME || "";
const ERC20_TOKEN_SYMBOL = process.env.ERC20_TOKEN_SYMBOL || "";

async function main() {

  const ERC20TokenMockFactory = await ethers.getContractFactory("ERC20TokenMock");

  const erc20Token = await ERC20TokenMockFactory.deploy(
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL
  ) as ERC20TokenMock;

  console.log("ERC20TokenMock deployed: ", erc20Token.address);
  await tryVerify(erc20Token.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });