import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat'
import { ArtWhaleERC1155 } from "../typechain-types/contracts/token/ArtWhaleERC1155";


describe("ArtWhaleERC1155", () => {

    let signers: SignerWithAddress[];
    let erc1155SignatureMint: ArtWhaleERC1155;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ArtWhaleERC1155 = await ethers.getContractFactory("ArtWhaleERC1155");
        erc1155SignatureMint = await ArtWhaleERC1155.deploy("erc1155Test", "ERC1155TEST", "/",signers[0].address) as ArtWhaleERC1155;
        await erc1155SignatureMint.deployed();

    });
    it("mint on demand", async () => {
        const domain = {
            name: "erc1155Test",
            version: '1',
            chainId: hre.ethers.provider.network.chainId,
            verifyingContract: erc1155SignatureMint.address
        }
    
        const types = {
            Mint : [
                {name: "target_", type: "address"},
                {name: "tokenId_", type: "uint256"},
                {name: "tokenAmount_", type: "uint256"},
                {name: "mintPrice_", type: "uint256"},
                {name: "nonce_", type: "uint256"},
                {name: "deadline_", type: "uint256"},
            ]
        }
    
        const value = {
            target_: signers[1].address,
            tokenId_: "0",
            tokenAmount_: "1",
            mintPrice_: "0",
            nonce_: 0,
            deadline_: "2669291763",
        }
    
        const signature = signers[0]._signTypedData(domain, types, value);

        await erc1155SignatureMint.connect(signers[1]).mint(
            signers[1].address,
            "0",
            "1",
            "0",
            "0",
            "2669291763",
            signature
        );

        console.log(await erc1155SignatureMint.balanceOf(signers[1].address, 0));
    });

});