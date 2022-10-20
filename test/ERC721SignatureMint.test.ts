import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat'
import { ERC721SignatureMint } from "../typechain-types/contracts/token/ERC721SignatureMint";


describe("ERC721SignatureMint", () => {

    let signers: SignerWithAddress[];
    let erc721SignatureMint: ERC721SignatureMint;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ERC721SignatureMint = await ethers.getContractFactory("ERC721SignatureMint");
        erc721SignatureMint = await ERC721SignatureMint.deploy("erc721Test", "ERC721TEST") as ERC721SignatureMint;
        await erc721SignatureMint.deployed();

    });
    it("mint on demand", async () => {
        console.log(await hre.run('accounts'));

        const domain = {
            name: "erc721Test",
            version: '1',
            chainId: hre.ethers.provider.network.chainId,
            verifyingContract: erc721SignatureMint.address
        }
    
        const types = {
            Mint : [
                {name: "tokenOwner", type: "address"},
                {name: "tokenId", type: "uint256"},
                {name: "uri", type: "string"},
                {name: "nonce", type: "uint256"},
                {name: "deadline", type: "uint256"},
            ]
        }
    
        const value = {
            tokenOwner: signers[1].address,
            tokenId: "0",
            uri: "/",
            nonce: 0,
            deadline: "1669291763",
        }
    
        const signature = signers[0]._signTypedData(domain, types, value);

        await erc721SignatureMint.connect(signers[1]).mint(
            signers[1].address,
            "0",
            "/",
            "0",
            "1669291763",
            signature
        );

        console.log(await erc721SignatureMint.ownerOf(0));
    });

});