import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { ArtWhaleERC1155 } from "../typechain-types/contracts/token/ArtWhaleERC1155";


describe("ArtWhaleERC1155", () => {

    let signers: SignerWithAddress[];
    let erc1155SignatureMint: ArtWhaleERC1155;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");
        
        erc1155SignatureMint = await upgrades.deployProxy(ArtWhaleERC1155Factory, [
            "erc1155Test", "ERC1155TEST", "/",signers[0].address,[]
        ]) as ArtWhaleERC1155;
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
                {name: "target", type: "address"},
                {name: "tokenId", type: "uint256"},
                {name: "tokenAmount", type: "uint256"},
                {name: "mintPrice", type: "uint256"},
                {name: "nonce", type: "uint256"},
                {name: "deadline", type: "uint256"},
            ]
        }
    
        const value = {
            target: signers[1].address,
            tokenId: "0",
            tokenAmount: "1",
            mintPrice: "0",
            nonce: 0,
            deadline: "2669291763",
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