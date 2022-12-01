import hre from "hardhat";
import { ethers } from "hardhat";
import { tryVerify } from "../../helpers/tryVerify";
import { ArtWhaleERC721 } from "../../typechain-types/contracts/token/ArtWhaleERC721";

// {
//   name: 'erc721TestSignature',
//   chainId: 5,
//   verifyingContract: '0x4617E1647615807E7EeAE18E4dc0f057Fceb3ca1',
//   version: '1'
// } {
//   Mint: [
//     { name: 'target', type: 'address' },
//     { name: 'tokenId', type: 'uint256' },
//     { name: 'uri', type: 'string' },
//     { name: 'mintPrice', type: 'uint256' },
//     { name: 'nonce', type: 'uint256' },
//     { name: 'deadline', type: 'uint256' }
//   ]
// } {
//   target: '0x9c6221ea7541bf4e74b112bcd984e50d35bdbac9',
//   tokenId: 9,
//   uri: 'bafkreidp6eh7wnouyhs6agtydix3fsvucmxluzabyi6dymkh7lodzp2tzy',
//   mintPrice: 0,
//   nonce: 9,
//   deadline: 3338754965230
// }

async function main() {

  const CONTRACT_ADDRESS = "0x4617E1647615807E7EeAE18E4dc0f057Fceb3ca1";
  const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");
  const artWhaleERC721 = await ArtWhaleERC721Factory.attach(CONTRACT_ADDRESS) as ArtWhaleERC721;

  const signers = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const domain = {
    name: "erc721TestSignature",
    chainId: network.chainId,
    verifyingContract: artWhaleERC721.address,
    version: '1',
  }  

  const types = {
      Mint : [
          {name: "target", type: "address"},
          {name: "tokenId", type: "uint256"},
          {name: "uri", type: "string"},
          {name: "mintPrice", type: "uint256"},
          {name: "nonce", type: "uint256"},
          {name: "deadline", type: "uint256"},
      ]
  }

  const value = {
      target: signers[0].address,
      tokenId: "9",
      uri: "bafkreidp6eh7wnouyhs6agtydix3fsvucmxluzabyi6dymkh7lodzp2tzy",
      mintPrice: "0",
      nonce: 9,
      deadline: "3338755666906",
  }

  // console.log(domain, "\n", types, "\n", value, "\n", "\n", "\n")
  const signature = await signers[0]._signTypedData(domain, types, value);

  console.log(signature);

  // await artWhaleERC721.mint(
  //     signers[0].address,
  //     "0",
  //     "/",
  //     "0",
  //     "0",
  //     "1669291763",
  //     signature
  // );

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });