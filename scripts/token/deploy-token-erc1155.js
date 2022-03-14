const ERC1155Token = artifacts.require("ERC1155Token");

const ERC1155_TOKEN_NAME = process.env.ERC1155_TOKEN_NAME || "";
const ERC1155_TOKEN_SYMBOL = process.env.ERC1155_TOKEN_SYMBOL || "";

async function main() {
  const token = await ERC1155Token.new(ERC1155_TOKEN_NAME, ERC1155_TOKEN_SYMBOL);
  ERC1155Token.setAsDeployed(token);

  console.log("ERC1155Token deployed: ", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });