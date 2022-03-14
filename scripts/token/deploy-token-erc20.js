const ERC20Token = artifacts.require("ERC20Token");

const ERC20_TOKEN_NAME = process.env.ERC20_TOKEN_NAME || "";
const ERC20_TOKEN_SYMBOL = process.env.ERC20_TOKEN_SYMBOL || "";

async function main() {
  const token = await ERC20Token.new(ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL);
  ERC20Token.setAsDeployed(token);

  console.log("ERC20Token deployed: ", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });