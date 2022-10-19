const ERC20Token = artifacts.require("ERC20Token");

const { tryVerify } = require("../../helpers/verify.js");

const ERC20_TOKEN_NAME = process.env.ERC20_TOKEN_NAME || "";
const ERC20_TOKEN_SYMBOL = process.env.ERC20_TOKEN_SYMBOL || "";

async function main() {
  const token = await ERC20Token.new(ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL);
  ERC20Token.setAsDeployed(token);

  console.log("ERC20Token deployed: ", token.address);
  await new Promise(r => setTimeout(r, 3000));
  await tryVerify(token.address, [ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });