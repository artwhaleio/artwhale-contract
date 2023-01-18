import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { ArtWhaleFactoryV1 } from "../typechain-types/contracts/ArtWhaleFactoryV1";
import { ArtWhaleERC721 } from "../typechain-types/contracts/token/ArtWhaleERC721";
import { ArtWhaleERC1155 } from "../typechain-types/contracts/token/ArtWhaleERC1155";


describe("ArtWhaleFactoryV1", () => {

    let signers: SignerWithAddress[];
    let artWhaleFactoryV1Factory: ArtWhaleFactoryV1;
    let artWhaleERC721Impl: ArtWhaleERC721;
    let artWhaleERC1155Impl: ArtWhaleERC1155;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ArtWhaleFactoryV1Factory = await ethers.getContractFactory("ArtWhaleFactoryV1");
        const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");
        const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");

        // implementations
        artWhaleERC721Impl = await ArtWhaleERC721Factory.deploy() as ArtWhaleERC721;
        await artWhaleERC721Impl.deployed();       
        artWhaleERC1155Impl = await ArtWhaleERC1155Factory.deploy() as ArtWhaleERC1155;
        await artWhaleERC1155Impl.deployed();       
        
        // target factory
        artWhaleFactoryV1Factory = await ArtWhaleFactoryV1Factory.deploy() as ArtWhaleFactoryV1;
        await artWhaleFactoryV1Factory.deployed();        

    });
    describe('deploy erc721', () => {
        it("positive case", async () => {

            await artWhaleFactoryV1Factory.connect(signers[0]).deployArtWhaleERC721(
                artWhaleERC721Impl.address,
                "123235342532545324",
                "testName",
                "TESTSYMB",
                signers[0].address,
                []
            );
        });
        
        it("negative cases", async () => {
            await expect(artWhaleFactoryV1Factory.connect(signers[1]).deployArtWhaleERC721(
                artWhaleERC721Impl.address,
                "123235342532545324",
                "testName",
                "TESTSYMB",
                signers[0].address,
                []
            )).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe('deploy erc1155', () => {
        it("positive case", async () => {

            await artWhaleFactoryV1Factory.connect(signers[0]).deployArtWhaleERC1155(
                artWhaleERC1155Impl.address,
                "123235342532545324",
                "testName",
                "TESTSYMB",
                "/",
                signers[0].address,
                []
            );
        });
        
        it("negative cases", async () => {
            await expect(artWhaleFactoryV1Factory.connect(signers[1]).deployArtWhaleERC1155(
                artWhaleERC1155Impl.address,
                "123235342532545324",
                "testName",
                "TESTSYMB",
                "/",
                signers[0].address,
                []
            )).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });


});