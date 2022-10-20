// // import { expect } from 'chai'
// import { parseEther, parseUnits } from 'ethers/lib/utils'
// import hre from "hardhat";
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';   
// import { BigNumber, constants, Contract, ContractFactory, Signer } from 'ethers'
// import { ethers } from 'hardhat'
// import { ZoaINO, ZoaINO__factory, ERC20Token, ERC20Token__factory, ERC1155Token, ERC1155Token__factory } from '../typechain';
// import { DeployBeaconProxyFunction } from '@openzeppelin/hardhat-upgrades/dist/deploy-beacon-proxy';

import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ino contract", () => {
    let ERC1155Token: ERC1155Token__factory;
    let ERC20Token: ERC20Token__factory;
    let ZoaINO: ZoaINO__factory;

    let signers: SignerWithAddress[]

    let erc1155: ERC1155Token;
    let erc20Base: ERC20Token;
    let erc20Other: ERC20Token;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        ERC1155Token = await ethers.getContractFactory("ERC1155Token");
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        ZoaINO = await ethers.getContractFactory("ZoaINO");

        erc1155 = await ERC1155Token.deploy("erc1155Test", "ERC1155TEST");
        await erc1155.deployed();
        erc20Base = await ERC20Token.deploy("erc20base", "ERC20BASE");
        await erc20Base.deployed();
        erc20Other = await ERC20Token.deploy("erc20other", "ERC20OTHER");
        await erc20Other.deployed();

    });
    it("Deployment", async () => {
        let [admin, partner] = signers;

        const zoa: ZoaINO = await ZoaINO.deploy();
        await zoa.deployed();
        await zoa.initialize(erc1155.address, erc20Base.address, partner.address);

        expect(await zoa.targetERC1155Collection()).to.equal(erc1155.address);
        expect(await zoa.baseCurrency()).to.equal(erc20Base.address);
        expect(await zoa.inoPartner()).to.equal(partner.address);

        expect(await zoa.currentPhase()).to.equal(1);

        expect(await zoa.owner()).to.equal(admin.address);
    });
    describe("methods", () => {
        let zoa: ZoaINO;
        let admin: SignerWithAddress;
        let whitelistedUser: SignerWithAddress;
        let unwhitelistedUser: SignerWithAddress;
        let partner: SignerWithAddress;
        let otherUser: SignerWithAddress;

        before(async () => {
            [admin, whitelistedUser, unwhitelistedUser, partner, otherUser] = signers;
        });

        beforeEach(async () => {

            zoa = await ZoaINO.deploy();
            await zoa.deployed();

            await expect(zoa.initialize(constants.AddressZero, erc20Base.address, partner.address)).to.be.revertedWith('ZoaINO: zero erc1155 address');
            await expect(zoa.initialize(erc1155.address, constants.AddressZero, partner.address)).to.be.revertedWith('ZoaINO: zero base currency address');
            await expect(zoa.initialize(erc1155.address, erc20Base.address, constants.AddressZero)).to.be.revertedWith('ZoaINO: zero ino partner address');

            await zoa.initialize(erc1155.address, erc20Base.address, partner.address);
        });
        describe("for admin", () => {
            it("set phase", async () => {
                await zoa.setPhase(0);
                expect(await zoa.currentPhase()).to.equal(0);

                await zoa.setPhase(2);
                expect(await zoa.currentPhase()).to.equal(2);

                // TODO make args check for emit
                await expect(zoa.setPhase(1))
                    .to.emit(zoa, 'SetPhase');

                await expect(zoa.connect(otherUser).setPhase(2)).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it("set nft prices", async () => {
                
                // null state
                expect(await zoa.nftPriceInBaseCurrency(0)).to.equal(parseUnits("0", "ether"));
                expect(await zoa.nftPriceInBaseCurrency(1)).to.equal(parseUnits("0", "ether"));
                expect(await zoa.nftPriceInBaseCurrency(2)).to.equal(parseUnits("0", "ether"));
                expect(await zoa.getTokenPrice(0, erc20Base.address)).to.equal(parseUnits("0", "ether"));
                expect(await zoa.getTokenPrice(1, erc20Base.address)).to.equal(parseUnits("0", "ether"));
                expect(await zoa.getTokenPrice(2, erc20Base.address)).to.equal(parseUnits("0", "ether"));

                await zoa.setNFTPricesInBaseCurrency([
                    {tokenId: 0, price: parseUnits("1", "ether")},
                    {tokenId: 1, price: parseUnits("2", "ether")},
                    {tokenId: 2, price: parseUnits("3", "ether")},
                ]);
                expect(await zoa.nftPriceInBaseCurrency(0)).to.equal(parseUnits("1", "ether"));
                expect(await zoa.nftPriceInBaseCurrency(1)).to.equal(parseUnits("2", "ether"));
                expect(await zoa.nftPriceInBaseCurrency(2)).to.equal(parseUnits("3", "ether"));
                expect(await zoa.getTokenPrice(0, erc20Base.address)).to.equal(parseUnits("1", "ether"));
                expect(await zoa.getTokenPrice(1, erc20Base.address)).to.equal(parseUnits("2", "ether"));
                expect(await zoa.getTokenPrice(2, erc20Base.address)).to.equal(parseUnits("3", "ether"));                

                await expect(zoa.setNFTPricesInBaseCurrency([{tokenId: 0, price: parseUnits("1", "ether")}]))
                    .to.emit(zoa, 'SetNFTPricesInBaseCurrency');

                // reverts
                await expect(zoa.connect(otherUser).setNFTPricesInBaseCurrency([])).to.be.revertedWith('Ownable: caller is not the owner');
                await expect(zoa.setNFTPricesInBaseCurrency([])).to.be.revertedWith('ZOAINO: array is empty');
            });

            it("set other currency ratio", async () => {
                
                // set nft price
                await zoa.setNFTPricesInBaseCurrency([
                    {tokenId: 0, price: parseUnits("1", "ether")},
                    {tokenId: 1, price: parseUnits("2", "ether")},
                    {tokenId: 2, price: parseUnits("3", "ether")},
                ]);

                // check null state
                expect(await zoa.otherCurrencyRatio(erc20Other.address)).to.equal(0);
                expect(await zoa.isOtherCurrency(erc20Other.address)).to.equal(false);
                await expect(zoa.getTokenPrice(0, erc20Other.address)).to.be.revertedWith('ZOAINO: currency not supported');

                await zoa.setOtherCurrencyRatio(erc20Other.address, parseUnits("0.01", "ether"));
                
                expect(await zoa.otherCurrencyRatio(erc20Other.address)).to.equal(parseUnits("0.01", "ether"));
                expect(await zoa.isOtherCurrency(erc20Other.address)).to.equal(true);
                expect(await zoa.getTokenPrice(0, erc20Other.address)).to.equal(parseUnits("0.01", "ether"));
                expect(await zoa.getTokenPrice(1, erc20Other.address)).to.equal(parseUnits("0.02", "ether"));
                expect(await zoa.getTokenPrice(2, erc20Other.address)).to.equal(parseUnits("0.03", "ether"));

                // reverts
                await expect(zoa.connect(otherUser).setOtherCurrencyRatio(erc20Other.address, parseUnits("0.01", "ether"))).to.be.revertedWith('Ownable: caller is not the owner');
                await expect(zoa.setOtherCurrencyRatio(erc20Base.address, parseUnits("0.01", "ether"))).to.be.revertedWith('ZOAINO: not for base currency');
            });

            it("add whitelist", async () => {
                
                // null state
                expect(await zoa.fetchWhitelist(0, 10)).to.deep.equal([[], BigNumber.from("0")]);
                expect(await zoa.isWhitelisted(whitelistedUser.address)).to.equal(false);
                expect(await zoa.isWhitelisted(otherUser.address)).to.equal(false);
                expect(await zoa.isWhitelisted(admin.address)).to.equal(false);
                expect(await zoa.totalWhitelisted()).to.equal(0);

                await zoa.addWhitelist([whitelistedUser.address]);

                expect(await zoa.fetchWhitelist(0, 10)).to.deep.equal([[whitelistedUser.address], BigNumber.from("1")]);
                expect(await zoa.isWhitelisted(whitelistedUser.address)).to.equal(true);
                expect(await zoa.totalWhitelisted()).to.equal(1);
    
                await expect(zoa.addWhitelist([otherUser.address, admin.address]))
                    .to.emit(zoa, 'AddWhitelist');
                
                expect(await zoa.fetchWhitelist(0, 3)).to.deep.equal([[whitelistedUser.address, otherUser.address, admin.address], BigNumber.from("3")]);
                expect(await zoa.isWhitelisted(otherUser.address)).to.equal(true);
                expect(await zoa.isWhitelisted(admin.address)).to.equal(true);
                expect(await zoa.totalWhitelisted()).to.equal(3);

                // reverts
                await expect(zoa.connect(otherUser).addWhitelist([])).to.be.revertedWith('Ownable: caller is not the owner');
                await expect(zoa.addWhitelist([])).to.be.revertedWith('ZOAINO: array is empty');
            });

            it("remove whitelist", async () => {
                
                // null state
                await zoa.addWhitelist([whitelistedUser.address]);
                await zoa.removeWhitelist([whitelistedUser.address]);

                expect(await zoa.fetchWhitelist(0, 10)).to.deep.equal([[], BigNumber.from("0")]);
                expect(await zoa.isWhitelisted(whitelistedUser.address)).to.equal(false);
                expect(await zoa.totalWhitelisted()).to.equal(0);
    
                await zoa.addWhitelist([whitelistedUser.address, otherUser.address, admin.address]);
                await expect(zoa.removeWhitelist([admin.address]))
                    .to.emit(zoa, 'RemoveWhitelist');
                
                expect(await zoa.fetchWhitelist(0, 10)).to.deep.equal([[whitelistedUser.address, otherUser.address], BigNumber.from("2")]);
                expect(await zoa.isWhitelisted(whitelistedUser.address)).to.equal(true);
                expect(await zoa.isWhitelisted(otherUser.address)).to.equal(true);
                expect(await zoa.isWhitelisted(admin.address)).to.equal(false);
                expect(await zoa.totalWhitelisted()).to.equal(2);

                // reverts
                await expect(zoa.connect(otherUser).removeWhitelist([])).to.be.revertedWith('Ownable: caller is not the owner');
                await expect(zoa.removeWhitelist([])).to.be.revertedWith('ZOAINO: array is empty');
            });

            it("withdraw currency", async () => {
                
                // mint tokens
                const currencyAmount1x = parseUnits("1", "ether");
                const currencyAmount2x = parseUnits("2", "ether");
                const currencyAmount3x = parseUnits("3", "ether");
                await erc20Base.mint(zoa.address, currencyAmount1x);
                await erc20Other.mint(zoa.address, currencyAmount2x);
                
                // send eth
                // await admin.sendTransaction({to: zoa.address, value: currencyAmount3x});
                // expect(await ethers.provider.getBalance(zoa.address)).to.equal(currencyAmount3x);

                // check balances before
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(currencyAmount1x);
                expect(await erc20Other.balanceOf(zoa.address)).to.equal(currencyAmount2x);
                expect(await erc20Other.balanceOf(zoa.address)).to.equal(currencyAmount2x);

                await zoa.withdrawCurrency(erc20Base.address, currencyAmount1x.div(2));
                await zoa.connect(partner).withdrawCurrency(erc20Base.address, currencyAmount1x.div(2));

                expect(await erc20Base.balanceOf(zoa.address)).to.equal(0);
                expect(await erc20Base.balanceOf(admin.address)).to.equal(currencyAmount1x.div(2));
                expect(await erc20Base.balanceOf(partner.address)).to.equal(currencyAmount1x.div(2));
    
                await expect(zoa.withdrawCurrency(erc20Other.address, currencyAmount2x.div(2)))
                    .to.emit(zoa, 'WithdrawCurrency');
                
                expect(await erc20Other.balanceOf(zoa.address)).to.equal(currencyAmount2x.div(2));

                // reverts
                await expect(zoa.connect(otherUser).withdrawCurrency(erc20Other.address, currencyAmount2x.div(2))).to.be.revertedWith('ZoaINO: only for owner/partner');
            });

            it("withdraw erc1155", async () => {
                
                // mint tokens
                const nftAmount = BigNumber.from(50);
                await erc1155.mintBatch(zoa.address, [0, 1, 2], [nftAmount, nftAmount, nftAmount], "0x");

                // check balances before
                expect(await erc1155.balanceOfBatch(
                    [zoa.address, zoa.address, zoa.address],
                    [0, 1, 2]
                )).to.deep.equal([BigNumber.from(50), BigNumber.from(50), BigNumber.from(50)]);

                await zoa.withdrawERC1155Admin(0, 1);

                expect(await erc1155.balanceOfBatch(
                    [zoa.address, zoa.address, zoa.address],
                    [0, 1, 2]
                )).to.deep.equal([BigNumber.from(49), BigNumber.from(50), BigNumber.from(50)]);
                expect(await erc1155.balanceOfBatch(
                    [admin.address, admin.address, admin.address],
                    [0, 1, 2]
                )).to.deep.equal([BigNumber.from(1), BigNumber.from(0), BigNumber.from(0)]);
    
                await expect(zoa.withdrawERC1155Admin(1, 2))
                    .to.emit(zoa, 'WithdrawERC1155Admin');
                
                expect(await erc1155.balanceOfBatch(
                    [zoa.address, zoa.address, zoa.address],
                    [0, 1, 2]
                )).to.deep.equal([BigNumber.from(49), BigNumber.from(48), BigNumber.from(50)]);
                expect(await erc1155.balanceOfBatch(
                    [admin.address, admin.address, admin.address],
                    [0, 1, 2]
                )).to.deep.equal([BigNumber.from(1), BigNumber.from(2), BigNumber.from(0)]);

                // reverts
                await expect(zoa.connect(otherUser).withdrawERC1155Admin(1, 2)).to.be.revertedWith('Ownable: caller is not the owner');
            });
        });
        describe("buy nft", () => {
            let totalTokensAmount: BigNumber;
            beforeEach(async () => {

                // setup contract
                await zoa.setNFTPricesInBaseCurrency([
                    {tokenId: 0, price: parseUnits("1", "ether")},
                    {tokenId: 1, price: parseUnits("2", "ether")},
                    {tokenId: 2, price: parseUnits("3", "ether")},
                ]);
                await zoa.setOtherCurrencyRatio(erc20Other.address, parseUnits("0.01", "ether"));
                await zoa.addWhitelist([whitelistedUser.address, otherUser.address]);

                // mint nfts
                await erc1155.safeMint(zoa.address, 0, 50, "0x");
                await erc1155.safeMint(zoa.address, 1, 50, "0x");
                await erc1155.safeMint(zoa.address, 2, 50, "0x");

                // prepare users
                totalTokensAmount = parseUnits("100", "ether");
                await erc20Base.connect(admin).approve(zoa.address, totalTokensAmount);
                await erc20Base.connect(whitelistedUser).approve(zoa.address, totalTokensAmount);
                await erc20Base.connect(unwhitelistedUser).approve(zoa.address, totalTokensAmount);
                await erc20Base.connect(partner).approve(zoa.address, totalTokensAmount);
                await erc20Base.connect(otherUser).approve(zoa.address, totalTokensAmount);
                await erc20Other.connect(admin).approve(zoa.address, totalTokensAmount);
                await erc20Other.connect(whitelistedUser).approve(zoa.address, totalTokensAmount);
                await erc20Other.connect(unwhitelistedUser).approve(zoa.address, totalTokensAmount);
                await erc20Other.connect(partner).approve(zoa.address, totalTokensAmount);
                await erc20Other.connect(otherUser).approve(zoa.address, totalTokensAmount);

                await erc20Base.mint(admin.address, totalTokensAmount);
                await erc20Base.mint(whitelistedUser.address, totalTokensAmount);
                await erc20Base.mint(unwhitelistedUser.address, totalTokensAmount);
                await erc20Base.mint(partner.address, totalTokensAmount);
            });

            it("single", async () => {

                //
                // phase 0
                //

                await zoa.setPhase(0);
                await expect(zoa.connect(whitelistedUser).buyNFT(0, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: sale closed');

                //
                // phase 3
                //

                await zoa.setPhase(3);
                await expect(zoa.connect(whitelistedUser).buyNFT(0, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: sale closed');

                //
                // phase 1
                //
                await zoa.setPhase(1);

                expect(await zoa.totalTokensBought(0)).to.equal(0);
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(0);
                expect(await erc20Base.balanceOf(admin.address)).to.equal(totalTokensAmount);
                const token1Price = await zoa.getTokenPrice(0, erc20Base.address);

                await zoa.connect(whitelistedUser).buyNFT(0, 1, erc20Base.address);

                expect(await zoa.totalTokensBought(0)).to.equal(1);
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(token1Price);
                expect(await erc20Base.balanceOf(whitelistedUser.address)).to.equal(totalTokensAmount.sub(token1Price));

                await expect(zoa.connect(unwhitelistedUser).buyNFT(0, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: whitelist phase only for whitelisted');
                await expect(zoa.connect(whitelistedUser).buyNFT(0, 50, erc20Base.address)).to.be.revertedWith('ZOAINO: not enough nft');
                await expect(zoa.connect(whitelistedUser).buyNFT(4, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: token id not for sale');
                await expect(zoa.connect(otherUser).buyNFT(1, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: not enough currency');

                //
                // phase 2
                //
                await zoa.setPhase(2);

                expect(await zoa.totalTokensBought(1)).to.equal(0);
                const token2Price = await zoa.getTokenPrice(1, erc20Base.address);

                await expect(zoa.connect(whitelistedUser).buyNFT(1, 2, erc20Base.address))
                    .to.emit(zoa, 'BuyNFT');

                expect(await zoa.totalTokensBought(1)).to.equal(2);
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(token1Price.add(token2Price.mul(2)));
                expect(await erc20Base.balanceOf(whitelistedUser.address)).to.equal(totalTokensAmount.sub(token1Price).sub(token2Price.mul(2)));

                await expect(zoa.connect(whitelistedUser).buyNFT(0, 50, erc20Base.address)).to.be.revertedWith('ZOAINO: not enough nft');
                await expect(zoa.connect(whitelistedUser).buyNFT(4, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: token id not for sale');
                await expect(zoa.connect(otherUser).buyNFT(1, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: not enough currency');

            });

            it("batch", async () => {

                //
                // phase 0
                //

                await zoa.setPhase(0);
                await expect(zoa.connect(whitelistedUser).buyNFTBatch([{tokenId: 0, amount: 1, forCurrency: erc20Base.address}])).to.be.revertedWith('ZOAINO: sale closed');

                //
                // phase 3
                //

                await zoa.setPhase(3);
                await expect(zoa.connect(whitelistedUser).buyNFTBatch([{tokenId: 0, amount: 1, forCurrency: erc20Base.address}])).to.be.revertedWith('ZOAINO: sale closed');

                //
                // phase 1
                //
                await zoa.setPhase(1);

                expect(await zoa.totalTokensBought(0)).to.equal(0);
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(0);
                expect(await erc20Base.balanceOf(admin.address)).to.equal(totalTokensAmount);
                const token1Price = await zoa.getTokenPrice(0, erc20Base.address);

                await zoa.connect(whitelistedUser).buyNFTBatch([{tokenId: 0, amount: 1, forCurrency: erc20Base.address}]);

                expect(await zoa.totalTokensBought(0)).to.equal(1);
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(token1Price);
                expect(await erc20Base.balanceOf(whitelistedUser.address)).to.equal(totalTokensAmount.sub(token1Price));

                await expect(zoa.connect(unwhitelistedUser).buyNFTBatch([{tokenId: 0, amount: 1, forCurrency: erc20Base.address}])).to.be.revertedWith('ZOAINO: whitelist phase only for whitelisted');
                await expect(zoa.connect(whitelistedUser).buyNFTBatch([{tokenId: 0, amount: 50, forCurrency: erc20Base.address}])).to.be.revertedWith('ZOAINO: not enough nft');
                await expect(zoa.connect(whitelistedUser).buyNFTBatch([{tokenId: 4, amount: 1, forCurrency: erc20Base.address}])).to.be.revertedWith('ZOAINO: token id not for sale');
                await expect(zoa.connect(otherUser).buyNFTBatch([{tokenId: 1, amount: 1, forCurrency: erc20Base.address}])).to.be.revertedWith('ZOAINO: not enough currency');

                //
                // phase 2
                //
                await zoa.setPhase(2);

                expect(await zoa.totalTokensBought(1)).to.equal(0);
                const token2Price = await zoa.getTokenPrice(1, erc20Base.address);

                await expect(zoa.connect(whitelistedUser).buyNFTBatch([{tokenId: 1, amount: 1, forCurrency: erc20Base.address}, {tokenId: 1, amount: 1, forCurrency: erc20Base.address}]))
                    .to.emit(zoa, 'BuyNFT');

                expect(await zoa.totalTokensBought(1)).to.equal(2);
                expect(await erc20Base.balanceOf(zoa.address)).to.equal(token1Price.add(token2Price.mul(2)));
                expect(await erc20Base.balanceOf(whitelistedUser.address)).to.equal(totalTokensAmount.sub(token1Price).sub(token2Price.mul(2)));

                await expect(zoa.connect(whitelistedUser).buyNFT(0, 50, erc20Base.address)).to.be.revertedWith('ZOAINO: not enough nft');
                await expect(zoa.connect(whitelistedUser).buyNFT(4, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: token id not for sale');
                await expect(zoa.connect(otherUser).buyNFT(1, 1, erc20Base.address)).to.be.revertedWith('ZOAINO: not enough currency');

            });
        });
    });
  });