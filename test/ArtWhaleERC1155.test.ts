import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { ArtWhaleERC1155Mock } from "../typechain-types/contracts/mocks/ArtWhaleERC1155Mock";
import { ArtWhaleERC1155 } from "../typechain-types/contracts/token/ArtWhaleERC1155";


describe("ArtWhaleERC1155", () => {

    let signers: SignerWithAddress[];
    let artWhaleERC1155: ArtWhaleERC1155;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ArtWhaleERC1155Factory = await ethers.getContractFactory("ArtWhaleERC1155");
        
        artWhaleERC1155 = await upgrades.deployProxy(ArtWhaleERC1155Factory, [
            "erc1155Test", "ERC1155TEST", "/",signers[0].address,[]
        ]) as ArtWhaleERC1155;
        await artWhaleERC1155.deployed();

    });
    describe('lazy minting', () => {
        let domain = {}
        let types = {}

        beforeEach(() => {
            domain = {
                name: "erc1155Test",
                version: '1',
                chainId: hre.ethers.provider.network.chainId,
                verifyingContract: artWhaleERC1155.address
            }
        
            types = {
                Mint : [
                    {name: "target", type: "address"},
                    {name: "tokenId", type: "uint256"},
                    {name: "tokenAmount", type: "uint256"},
                    {name: "mintPrice", type: "uint256"},
                    {name: "nonce", type: "uint256"},
                    {name: "deadline", type: "uint256"},
                ]
            }
        });

        it("mint on demand then burn", async () => {

            const value = {
                target: signers[1].address,
                tokenId: "0",
                tokenAmount: "2",
                mintPrice: "0",
                nonce: 0,
                deadline: "2669291763",
            }

            const signature = signers[0]._signTypedData(domain, types, value);

            await artWhaleERC1155.connect(signers[1]).mint(
                signers[1].address,
                "0",
                "2",
                "0",
                "0",
                "2669291763",
                signature
            );

            expect(await artWhaleERC1155.balanceOf(signers[1].address, 0)).to.be.equal("2");

            await artWhaleERC1155.connect(signers[1]).burn(
                signers[1].address, 0, 1
            );

            expect(await artWhaleERC1155.balanceOf(signers[1].address, 0)).to.be.equal("1");

            await artWhaleERC1155.connect(signers[1]).burnBatch(
                signers[1].address, [0], [1]
            );

            expect(await artWhaleERC1155.balanceOf(signers[1].address, 0)).to.be.equal("0");
        });
        
        it("negative cases", async () => {
            // re-user nonce
            const value1 = {
                target: signers[1].address,
                tokenId: "0",
                tokenAmount: "1",
                mintPrice: "0",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature1 = signers[0]._signTypedData(domain, types, value1);
            await artWhaleERC1155.mint(
                signers[1].address,
                "0",
                "1",
                "0",
                "0",
                "2669291763",
                signature1
            );
            const value2 = {
                target: signers[1].address,
                tokenId: 2,
                tokenAmount: "1",
                mintPrice: "0",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature2 = signers[0]._signTypedData(domain, types, value2);
            await expect(artWhaleERC1155.mint(
                signers[1].address,
                "2",
                "1",
                "0",
                "0",
                "2669291763",
                signature2
            )).to.be.revertedWith("ArtWhaleERC1155: nonce already used");
            
            // expired deadline
            const value3 = {
                target: signers[1].address,
                tokenId: 3,
                tokenAmount: "1",
                mintPrice: "0",
                nonce: 0,
                deadline: "10000",
            }    
            const signature3 = signers[0]._signTypedData(domain, types, value3);
            await expect(artWhaleERC1155.mint(
                signers[1].address,
                "3",
                "1",
                "0",
                "4",
                "10000",
                signature3
            )).to.be.revertedWith("ArtWhaleERC1155: expired deadline");

            // wrong mint price
            const value4 = {
                target: signers[1].address,
                tokenId: 4,
                tokenAmount: "1",
                mintPrice: "10",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature4 = signers[0]._signTypedData(domain, types, value4);
            await expect(artWhaleERC1155.mint(
                signers[1].address,
                "4",
                "1",
                "10",
                "4",
                "2669291763",
                signature4,
                {value: "10001"}
            )).to.be.revertedWith("ArtWhaleERC1155: wrong mint price");

            // wrong signature
            const value5 = {
                target: signers[1].address,
                tokenId: 4,
                tokenAmount: "2",
                mintPrice: "100",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature5 = signers[0]._signTypedData(domain, types, value5);
            await expect(artWhaleERC1155.mint(
                signers[1].address,
                "4",
                "1",
                "100",
                "4",
                "2669291763",
                signature5,
                {value: "100"}
            )).to.be.revertedWith("ArtWhaleERC1155: invalid signature");
        });

    });

    describe("uri", () =>  {
        it('default value', async () => {
            expect(await artWhaleERC1155.uri(0)).to.be.equal('/');
        });

        it('set uri', async () => {
            const ArtWhaleERC1155FactoryMock = await ethers.getContractFactory("ArtWhaleERC1155Mock");
            const artWhaleERC1155Mock = await ArtWhaleERC1155FactoryMock.deploy(
                "erc721Test", "ERC721TEST"
            );
            await artWhaleERC1155Mock.deployed();

            await artWhaleERC1155Mock.mintTo(signers[0].address, 0, 1);
            const newURI = "12345ABC";
            
            // TODO improve this
            await expect(artWhaleERC1155Mock.setURI(newURI)).to.be.revertedWith("TokenOperatorUpgradeable: caller is not the operator");

            await artWhaleERC1155Mock.setOperator(signers[0].address);

            await artWhaleERC1155Mock.setURI(newURI)
            expect(await artWhaleERC1155Mock.uri(0)).to.be.equal(newURI);
        });
    });

});