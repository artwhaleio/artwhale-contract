import hre from "hardhat";
import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC1155 } from "../../typechain-types/contracts/token/ArtWhaleERC1155";


async function main() {

  const CONTRACT_ADDRESS = "0xa0a8f4d2b27bf3b060b20394fa22117b1d0a8e0b";
  const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");
  const artWhaleERC1155 = await ArtWhaleERC1155Factory.attach(CONTRACT_ADDRESS) as ArtWhaleERC1155;

  const signers = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const domain = {
    name: "OFAM DIGITAL MEMBERSHIP",
    chainId: network.chainId,
    verifyingContract: artWhaleERC1155.address,
    version: '1',
  }  

  const types = {
      Mint : [
          {name: "target", type: "address"},
          {name: "tokenId", type: "uint256"},
          {name: "tokenAmount", type: "uint256"},
          {name: "mintPrice", type: "uint256"},
          {name: "nonce", type: "uint256"},
          {name: "deadline", type: "uint256"},
      ]
  }

  const value = {
      target: signers[0].address,
      tokenId: "28",
      tokenAmount: "1",
      mintPrice: "0",
      nonce: 0,
      deadline: "3338755666906",
  }

  const signature = await signers[0]._signTypedData(domain, types, value);

  console.log(signers[0].address);
  console.log(signature);

  // await artWhaleERC1155.connect(signers[0].address).callStatic.mint(
  //     signers[0].address,
  //     "28",
  //     "1",
  //     "0",
  //     "0",
  //     "3338755666906",
  //     signature  
  // );
  let tx = await artWhaleERC1155.mint(
      signers[0].address,
      "28",
      "1",
      "0",
      "0",
      "3338755666906",
      signature
  );

  console.log(tx);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });