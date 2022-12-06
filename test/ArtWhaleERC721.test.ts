import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { BigNumber } from "ethers";
import { ArtWhaleERC721 } from "../typechain-types/contracts/token/ArtWhaleERC721";
import { ArtWhaleERC721Mock } from "../typechain-types/contracts/mocks/ArtWhaleERC721Mock";

describe("ArtWhaleERC721", () => {

    let signers: SignerWithAddress[];
    let artWhaleERC721: ArtWhaleERC721;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const ArtWhaleERC721Factory = await ethers.getContractFactory("ArtWhaleERC721");
        
        artWhaleERC721 = await upgrades.deployProxy(ArtWhaleERC721Factory, [
            "erc721Test", "ERC721TEST",signers[0].address,[]
        ]) as ArtWhaleERC721;
        await artWhaleERC721.deployed();

    });
    describe('lazy minting', () => {
        let domain = {}
        let types = {}

        beforeEach(() => {
            domain = {
                name: "erc721Test",
                version: '1',
                chainId: hre.ethers.provider.network.chainId,
                verifyingContract: artWhaleERC721.address
            }
    
            types = {
                Mint : [
                    {name: "target", type: "address"},
                    {name: "tokenId", type: "uint256"},
                    {name: "uri", type: "string"},
                    {name: "mintPrice", type: "uint256"},
                    {name: "nonce", type: "uint256"},
                    {name: "deadline", type: "uint256"},
                ]
            }
        });

        it("mint on demand", async () => {
        
            const value = {
                target: signers[1].address,
                tokenId: "0",
                uri: "/",
                mintPrice: "0",
                nonce: 0,
                deadline: "2669291763",
            }
        
            const signature = signers[0]._signTypedData(domain, types, value);
    
            await artWhaleERC721.connect(signers[1]).mint(
                signers[1].address,
                "0",
                "/",
                "0",
                "0",
                "2669291763",
                signature
            );
    
            expect(await artWhaleERC721.ownerOf(0)).to.be.equal(signers[1].address);
        });

        it("negative cases", async () => {
            // re-user nonce
            const value1 = {
                target: signers[1].address,
                tokenId: "0",
                uri: "/",
                mintPrice: "0",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature1 = signers[0]._signTypedData(domain, types, value1);
            await artWhaleERC721.mint(
                signers[1].address,
                "0",
                "/",
                "0",
                "0",
                "2669291763",
                signature1
            );
            const value2 = {
                target: signers[1].address,
                tokenId: 2,
                uri: "/",
                mintPrice: "0",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature2 = signers[0]._signTypedData(domain, types, value2);
            await expect(artWhaleERC721.mint(
                signers[1].address,
                "2",
                "/",
                "0",
                "0",
                "2669291763",
                signature2
            )).to.be.revertedWith("ArtWhaleERC721: nonce already used");
            
            // expired deadline
            const value3 = {
                target: signers[1].address,
                tokenId: 3,
                uri: "/",
                mintPrice: "0",
                nonce: 0,
                deadline: "10000",
            }    
            const signature3 = signers[0]._signTypedData(domain, types, value3);
            await expect(artWhaleERC721.mint(
                signers[1].address,
                "3",
                "/",
                "0",
                "4",
                "10000",
                signature3
            )).to.be.revertedWith("ArtWhaleERC721: expired deadline");

            // wrong mint price
            const value4 = {
                target: signers[1].address,
                tokenId: 4,
                uri: "/",
                mintPrice: "10",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature4 = signers[0]._signTypedData(domain, types, value4);
            await expect(artWhaleERC721.mint(
                signers[1].address,
                "4",
                "/",
                "10",
                "4",
                "2669291763",
                signature4,
                {value: "10001"}
            )).to.be.revertedWith("ArtWhaleERC721: wrong mint price");

            // wrong signature
            const value5 = {
                target: signers[1].address,
                tokenId: 4,
                uri: "/",
                mintPrice: "100",
                nonce: 0,
                deadline: "2669291763",
            }    
            const signature5 = signers[0]._signTypedData(domain, types, value5);
            await expect(artWhaleERC721.mint(
                signers[1].address,
                "4",
                "/",
                "100",
                "4",
                "2669291763",
                signature5,
                {value: "100"}
            )).to.be.revertedWith("ArtWhaleERC721: invalid signature");
        });
        
        
    });

    describe("uri", () =>  {
        it('default value', async () => {
            await expect(artWhaleERC721.tokenURI(0)).to.be.revertedWith('ERC721: invalid token ID');
        });

        it('set uri', async () => {
            const ArtWhaleERC721FactoryMock = await ethers.getContractFactory("ArtWhaleERC721Mock");
            const artWhaleERC721Mock = await ArtWhaleERC721FactoryMock.deploy(
                "erc721Test", "ERC721TEST"
            );
            await artWhaleERC721Mock.deployed();

            await artWhaleERC721Mock.mintTo(signers[0].address, 0, "");
            const newURI = "12345ABC";
            
            // TODO improve this
            await expect(artWhaleERC721Mock.setURI(0, newURI)).to.be.revertedWith("TokenOperatorUpgradeable: caller is not the operator");

            await artWhaleERC721Mock.setOperator(signers[0].address);

            await artWhaleERC721Mock.setURI(0, newURI)
            expect(await artWhaleERC721Mock.tokenURI(0)).to.be.equal(newURI);
        });
    });

    describe("royalty", () =>  {
        it("empty default royalty value by default", async () => {
            expect(await artWhaleERC721.defaultRoyaltyInfo()).to.deep.equal([]);
        });

        it("empty token royalty value by default", async () => {
            expect(await artWhaleERC721.tokenRoyaltyInfo(0)).to.deep.equal([]);
            expect(await artWhaleERC721.tokenRoyaltyInfo(1)).to.deep.equal([]);
            expect(await artWhaleERC721.tokenRoyaltyInfo(2)).to.deep.equal([]);
            expect(await artWhaleERC721.tokenRoyaltyInfo(3)).to.deep.equal([]);
            expect(await artWhaleERC721.tokenRoyaltyInfo(4)).to.deep.equal([]);
        });

        describe("set royalty", () =>  {
            it('for default royalty', async () => {
                expect(await artWhaleERC721.tokenRoyaltyInfo(3)).to.deep.equal([]);
                expect(await artWhaleERC721.defaultRoyaltyInfo()).to.have.length(0);

                const defaultRoyalty = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('100')
                    },
                    {
                        receiver: signers[2].address,
                        royaltyFraction: BigNumber.from('200')
                    },
                ]
                await artWhaleERC721.setDefaultRoyalty(defaultRoyalty);

                // TODO change length to real values
                expect(await artWhaleERC721.tokenRoyaltyInfo(3)).to.deep.equal([]);
                expect(await artWhaleERC721.defaultRoyaltyInfo()).to.have.length(2);
            });
            it('for token royalty', async () => {
                expect(await artWhaleERC721.tokenRoyaltyInfo(3)).to.deep.equal([]);
                expect(await artWhaleERC721.defaultRoyaltyInfo()).to.have.length(0);

                const defaultRoyalty = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('100')
                    },
                    {
                        receiver: signers[2].address,
                        royaltyFraction: BigNumber.from('200')
                    },
                ]
                await artWhaleERC721.setTokenRoyalty(3, defaultRoyalty);

                // TODO change length to real values
                expect(await artWhaleERC721.tokenRoyaltyInfo(3)).to.have.length(2);
                expect(await artWhaleERC721.defaultRoyaltyInfo()).to.have.length(0);
            });
        });

        describe("royalty calculating", () =>  {
            it("with empty default royalty", async () => {
                const salePrice = ethers.BigNumber.from("10000");

                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).to.deep.equal(
                    [[],[],ethers.BigNumber.from("0")]
                );
            });

            it("with single default royalty", async () => {
                var salePrice;
                var fraction;
                
                // calculating result = salePrice * fraction / 10 000

                //
                // 1st case
                //
                fraction = ethers.BigNumber.from("1000");  // 10%
                await artWhaleERC721.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("20000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("2000")],ethers.BigNumber.from("2000")]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("25000")],ethers.BigNumber.from("25000")]
                );

                //
                // 2nd case
                //
                fraction = ethers.BigNumber.from("1500");  // 15%
                await artWhaleERC721.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("160000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("24000")],ethers.BigNumber.from("24000")]
                );
                salePrice = ethers.BigNumber.from("10000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("1500")],ethers.BigNumber.from("1500")]
                );
            });

            it("with multiply default royalty", async () => {
                var salePrice;
                var fraction1;
                var fraction2;
                var fraction3;
                
                // calculating result = salePrice * fraction / 10 000

                //
                // 1st case
                //
                fraction1 = ethers.BigNumber.from("1000");  // 10%
                fraction2 = ethers.BigNumber.from("2000");  // 20%
                await artWhaleERC721.setDefaultRoyalty([
                {
                    receiver: signers[1].address,
                    royaltyFraction: fraction1
                },
                {
                    receiver: signers[2].address,
                    royaltyFraction: fraction2
                },
                ]);
                salePrice = ethers.BigNumber.from("20000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address],
                        [ethers.BigNumber.from("2000"), ethers.BigNumber.from("4000")],
                        ethers.BigNumber.from("6000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address],
                        [ethers.BigNumber.from("25000"), ethers.BigNumber.from("50000")],
                        ethers.BigNumber.from("75000")
                    ]
                );

                //
                // 2nd case
                //
                fraction1 = ethers.BigNumber.from("1500");  // 15%
                fraction2 = ethers.BigNumber.from("2500");  // 25%
                fraction3 = ethers.BigNumber.from("100");   // 1%
                await artWhaleERC721.setDefaultRoyalty([
                {
                    receiver: signers[1].address,
                    royaltyFraction: fraction1
                },
                {
                    receiver: signers[2].address,
                    royaltyFraction: fraction2
                },
                {
                    receiver: signers[3].address,
                    royaltyFraction: fraction3
                },
                ]);
                salePrice = ethers.BigNumber.from("100000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("15000"), ethers.BigNumber.from("25000"), ethers.BigNumber.from("1000")],
                        ethers.BigNumber.from("41000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("37500"), ethers.BigNumber.from("62500"), ethers.BigNumber.from("2500")],
                        ethers.BigNumber.from("102500")
                    ]
                );
            });

            it("with single token royalty", async () => {
                var salePrice;
                var wrongFraction;
                var fraction;
                
                // calculating result = salePrice * fraction / 10 000

                //
                // 1st case
                //
                wrongFraction = ethers.BigNumber.from("2000");  // 20%
                await artWhaleERC721.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: wrongFraction
                }]);
                fraction = ethers.BigNumber.from("1000");  // 10%
                await artWhaleERC721.setTokenRoyalty(0, [{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("20000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("2000")],ethers.BigNumber.from("2000")]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("25000")],ethers.BigNumber.from("25000")]
                );

                //
                // 2nd case
                //
                await artWhaleERC721.setDefaultRoyalty([]);
                fraction = ethers.BigNumber.from("1500");  // 15%
                await artWhaleERC721.setTokenRoyalty(0, [{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("160000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("24000")],ethers.BigNumber.from("24000")]
                );
                salePrice = ethers.BigNumber.from("10000");
                expect(await artWhaleERC721.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("1500")],ethers.BigNumber.from("1500")]
                );
            });
            
            it("with multiply token royalty", async () => {
                var salePrice;
                var fraction1;
                var fraction2;
                var fraction3;
                var wrongFraction;
                
                // calculating result = salePrice * fraction / 10 000

                //
                // 1st case
                //
                wrongFraction = ethers.BigNumber.from("2500");  // 25%
                await artWhaleERC721.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: wrongFraction
                }]);
                fraction1 = ethers.BigNumber.from("1000");  // 10%
                fraction2 = ethers.BigNumber.from("2000");  // 20%
                await artWhaleERC721.setTokenRoyalty(1, [
                {
                    receiver: signers[1].address,
                    royaltyFraction: fraction1
                },
                {
                    receiver: signers[2].address,
                    royaltyFraction: fraction2
                },
                ]);
                salePrice = ethers.BigNumber.from("20000");
                expect(await artWhaleERC721.calculateRoyalty(1, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address],
                        [ethers.BigNumber.from("2000"), ethers.BigNumber.from("4000")],
                        ethers.BigNumber.from("6000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await artWhaleERC721.calculateRoyalty(1, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address],
                        [ethers.BigNumber.from("25000"), ethers.BigNumber.from("50000")],
                        ethers.BigNumber.from("75000")
                    ]
                );

                //
                // 2nd case
                //
                fraction1 = ethers.BigNumber.from("1500");  // 15%
                fraction2 = ethers.BigNumber.from("2500");  // 25%
                fraction3 = ethers.BigNumber.from("100");   // 1%
                await artWhaleERC721.setTokenRoyalty(2, [
                {
                    receiver: signers[1].address,
                    royaltyFraction: fraction1
                },
                {
                    receiver: signers[2].address,
                    royaltyFraction: fraction2
                },
                {
                    receiver: signers[3].address,
                    royaltyFraction: fraction3
                },
                ]);
                salePrice = ethers.BigNumber.from("100000");
                expect(await artWhaleERC721.calculateRoyalty(2, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("15000"), ethers.BigNumber.from("25000"), ethers.BigNumber.from("1000")],
                        ethers.BigNumber.from("41000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await artWhaleERC721.calculateRoyalty(2, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("37500"), ethers.BigNumber.from("62500"), ethers.BigNumber.from("2500")],
                        ethers.BigNumber.from("102500")
                    ]
                );
            });

        });

    });

});