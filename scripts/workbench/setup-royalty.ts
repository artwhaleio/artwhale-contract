import hre from "hardhat";
import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC721 } from "../../typechain-types/contracts/token/ArtWhaleERC721";
import { ArtWhaleERC1155 } from "../../typechain-types/contracts/token/ArtWhaleERC1155";

async function main() {

  const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");
  const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");

  const artWhaleERC721 = await ArtWhaleERC721Factory.attach("0xF412D1eFDDB3781502711c74a950DC89d76fc9dE") as ArtWhaleERC721;
  const artWhaleERC1155 = await ArtWhaleERC1155Factory.attach("0xD4e4Ad77fF9733Cc5D612D3Df3A0868616d30C7c") as ArtWhaleERC1155;

  await artWhaleERC721.setDefaultRoyalty([{
    receiver: "0x9c6221ea7541bf4e74b112bcd984e50d35bdbac9",
    royaltyFraction: "1000"
  }]);
  await artWhaleERC1155.setDefaultRoyalty([{
    receiver: "0x9c6221ea7541bf4e74b112bcd984e50d35bdbac9",
    royaltyFraction: "1000"
  }]);

  console.log("job done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });