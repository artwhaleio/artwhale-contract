import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { BigNumber } from "ethers";
import { RoyaltyUpgradeableMock } from "../typechain-types/contracts/mocks/RoyaltyUpgradeableMock";

describe("RoyaltyUpgradeable", () => {

    let signers: SignerWithAddress[];
    let royaltyUpgradeable: RoyaltyUpgradeableMock;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const RoyaltyUpgradeableMockFactory = await ethers.getContractFactory("RoyaltyUpgradeableMock");
        
        royaltyUpgradeable = await RoyaltyUpgradeableMockFactory.deploy() as RoyaltyUpgradeableMock;
        await royaltyUpgradeable.deployed();

    });

    describe("royalty value", () =>  {
        it("empty default royalty value by default", async () => {
            expect(await royaltyUpgradeable.defaultRoyaltyInfo()).to.deep.equal([]);
        });

        it("empty token royalty value by default", async () => {
            expect(await royaltyUpgradeable.tokenRoyaltyInfo(0)).to.deep.equal([]);
            expect(await royaltyUpgradeable.tokenRoyaltyInfo(1)).to.deep.equal([]);
            expect(await royaltyUpgradeable.tokenRoyaltyInfo(2)).to.deep.equal([]);
            expect(await royaltyUpgradeable.tokenRoyaltyInfo(3)).to.deep.equal([]);
            expect(await royaltyUpgradeable.tokenRoyaltyInfo(4)).to.deep.equal([]);
        });

        describe("set royalty", () =>  {
            it('for default royalty', async () => {
                expect(await royaltyUpgradeable.tokenRoyaltyInfo(3)).to.deep.equal([]);
                expect(await royaltyUpgradeable.defaultRoyaltyInfo()).to.have.length(0);

                const defaultRoyalty = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('100')
                    },
                    {
                        receiver: signers[2].address,
                        royaltyFraction: BigNumber.from('200')
                    },
                ];
                await royaltyUpgradeable.setDefaultRoyalty(defaultRoyalty);

                // TODO change length to real values
                expect(await royaltyUpgradeable.tokenRoyaltyInfo(3)).to.deep.equal([]);
                expect(await royaltyUpgradeable.defaultRoyaltyInfo()).to.have.length(2);
            });
            it('for token royalty', async () => {
                expect(await royaltyUpgradeable.tokenRoyaltyInfo(3)).to.deep.equal([]);
                expect(await royaltyUpgradeable.defaultRoyaltyInfo()).to.have.length(0);

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
                await royaltyUpgradeable.setTokenRoyalty(3, defaultRoyalty);

                // TODO change length to real values
                expect(await royaltyUpgradeable.tokenRoyaltyInfo(3)).to.have.length(2);
                expect(await royaltyUpgradeable.defaultRoyaltyInfo()).to.have.length(0);
            });

            it('negative cases', async () => {
                const royalty = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('100')
                    },
                    {
                        receiver: signers[2].address,
                        royaltyFraction: BigNumber.from('200')
                    },
                ];
                
                await expect(royaltyUpgradeable.connect(signers[1]).setDefaultRoyalty(royalty)).to.be.revertedWith("Ownable: caller is not the owner");
                await expect(royaltyUpgradeable.connect(signers[1]).setTokenRoyalty(0, royalty)).to.be.revertedWith("Ownable: caller is not the owner");
            });
        });

        describe("royalty calculating", () =>  {
            it("with empty default royalty", async () => {
                const salePrice = ethers.BigNumber.from("10000");

                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).to.deep.equal(
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
                await royaltyUpgradeable.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("20000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("2000")],ethers.BigNumber.from("2000")]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("25000")],ethers.BigNumber.from("25000")]
                );

                //
                // 2nd case
                //
                fraction = ethers.BigNumber.from("1500");  // 15%
                await royaltyUpgradeable.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("160000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("24000")],ethers.BigNumber.from("24000")]
                );
                salePrice = ethers.BigNumber.from("10000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
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
                await royaltyUpgradeable.setDefaultRoyalty([
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
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address],
                        [ethers.BigNumber.from("2000"), ethers.BigNumber.from("4000")],
                        ethers.BigNumber.from("6000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
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
                await royaltyUpgradeable.setDefaultRoyalty([
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
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("15000"), ethers.BigNumber.from("25000"), ethers.BigNumber.from("1000")],
                        ethers.BigNumber.from("41000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
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
                await royaltyUpgradeable.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: wrongFraction
                }]);
                fraction = ethers.BigNumber.from("1000");  // 10%
                await royaltyUpgradeable.setTokenRoyalty(0, [{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("20000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("2000")],ethers.BigNumber.from("2000")]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("25000")],ethers.BigNumber.from("25000")]
                );

                //
                // 2nd case
                //
                await royaltyUpgradeable.setDefaultRoyalty([]);
                fraction = ethers.BigNumber.from("1500");  // 15%
                await royaltyUpgradeable.setTokenRoyalty(0, [{
                    receiver: signers[1].address,
                    royaltyFraction: fraction
                }]);
                salePrice = ethers.BigNumber.from("160000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
                    [[signers[1].address],[ethers.BigNumber.from("24000")],ethers.BigNumber.from("24000")]
                );
                salePrice = ethers.BigNumber.from("10000");
                expect(await royaltyUpgradeable.calculateRoyalty(0, salePrice)).deep.equal(
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
                await royaltyUpgradeable.setDefaultRoyalty([{
                    receiver: signers[1].address,
                    royaltyFraction: wrongFraction
                }]);
                fraction1 = ethers.BigNumber.from("1000");  // 10%
                fraction2 = ethers.BigNumber.from("2000");  // 20%
                await royaltyUpgradeable.setTokenRoyalty(1, [
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
                expect(await royaltyUpgradeable.calculateRoyalty(1, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address],
                        [ethers.BigNumber.from("2000"), ethers.BigNumber.from("4000")],
                        ethers.BigNumber.from("6000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await royaltyUpgradeable.calculateRoyalty(1, salePrice)).deep.equal(
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
                await royaltyUpgradeable.setTokenRoyalty(2, [
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
                expect(await royaltyUpgradeable.calculateRoyalty(2, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("15000"), ethers.BigNumber.from("25000"), ethers.BigNumber.from("1000")],
                        ethers.BigNumber.from("41000")
                    ]
                );
                salePrice = ethers.BigNumber.from("250000");
                expect(await royaltyUpgradeable.calculateRoyalty(2, salePrice)).deep.equal(
                    [
                        [signers[1].address, signers[2].address, signers[3].address],
                        [ethers.BigNumber.from("37500"), ethers.BigNumber.from("62500"), ethers.BigNumber.from("2500")],
                        ethers.BigNumber.from("102500")
                    ]
                );
            });

            it('negative cases', async () => {
                // wrong reciever
                const royalty1 = [
                    {
                        receiver: ethers.constants.AddressZero,
                        royaltyFraction: BigNumber.from('100')
                    }
                ];
                await expect(royaltyUpgradeable.checkRoyalty(royalty1)).to.be.revertedWith("RoyaltyUpgradeable: wrong receiver");

                // wrong fraction
                const royalty2 = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('10000')
                    }
                ];
                await expect(royaltyUpgradeable.checkRoyalty(royalty2)).to.be.revertedWith("RoyaltyUpgradeable: wrong royalty fraction");
                const royalty3 = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('11000')
                    }
                ];
                await expect(royaltyUpgradeable.checkRoyalty(royalty3)).to.be.revertedWith("RoyaltyUpgradeable: wrong royalty fraction");

                // wrong total sum
                const royalty4 = [
                    {
                        receiver: signers[1].address,
                        royaltyFraction: BigNumber.from('5000')
                    },
                    {
                        receiver: signers[2].address,
                        royaltyFraction: BigNumber.from('5000')
                    }
                ];
                await expect(royaltyUpgradeable.checkRoyalty(royalty4)).to.be.revertedWith("RoyaltyUpgradeable: wrong royalty sum");
            });

        });

    });

});