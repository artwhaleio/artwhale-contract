import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat'
import { ArtWhaleERC721 } from "../typechain-types/contracts/token/ArtWhaleERC721";


describe("ArtWhaleERC721", () => {

    let signers: SignerWithAddress[];
    let erc721SignatureMint: ArtWhaleERC721;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ArtWhaleERC721 = await ethers.getContractFactory("ArtWhaleERC721");
        erc721SignatureMint = await ArtWhaleERC721.deploy("erc721Test", "ERC721TEST",signers[0].address) as ArtWhaleERC721;
        await erc721SignatureMint.deployed();

    });
    it("mint on demand", async () => {
        const domain = {
            name: "erc721Test",
            version: '1',
            chainId: hre.ethers.provider.network.chainId,
            verifyingContract: erc721SignatureMint.address
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
            target: signers[1].address,
            tokenId: "0",
            uri: "/",
            mintPrice: "0",
            nonce: 0,
            deadline: "1669291763",
        }
    
        const signature = signers[0]._signTypedData(domain, types, value);

        await erc721SignatureMint.connect(signers[1]).mint(
            signers[1].address,
            "0",
            "/",
            "0",
            "0",
            "1669291763",
            signature
        );

        console.log(await erc721SignatureMint.ownerOf(0));
    });

});