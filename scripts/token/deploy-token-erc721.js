const ERC721Token = artifacts.require("ERC721Token");

const ERC721_TOKEN_NAME = process.env.ERC721_TOKEN_NAME || "";
const ERC721_TOKEN_SYMBOL = process.env.ERC721_TOKEN_SYMBOL || "";

async function main() {
  const token = await ERC721Token.new(ERC721_TOKEN_NAME, ERC721_TOKEN_SYMBOL);
  ERC721Token.setAsDeployed(token);

  console.log("ERC721Token deployed: ", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });