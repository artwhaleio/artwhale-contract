import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { BigNumber, ContractFactory } from "ethers";
import { ArtWhaleMarketplace } from "../typechain-types/contracts/ArtWhaleMarketplace";
import { ERC20TokenMock } from "../typechain-types/contracts/mocks/ERC20TokenMock";
import { ArtWhaleERC721Mock } from "../typechain-types/contracts/mocks/ArtWhaleERC721Mock";
import { ArtWhaleERC1155Mock } from "../typechain-types/contracts/mocks/ArtWhaleERC1155Mock";

const OrderType = {
    P2P: "0",
    AUTHORITY: "1",
}

const OrderStatus = {
    NULL: "0",
    OPEN: "1",
    CANCELLED: "2",
    EXECUTED: "3",
    ANY: "4",
}

const NFTStandart = {
    NULL: "0",
    ERC721: "1",
    ERC1155: "2",
}

describe("ArtWhaleMarketplace", () => {

    let signers: SignerWithAddress[];
    let artWhaleMarketplace: ArtWhaleMarketplace;
    let erc20: ERC20TokenMock;
    let erc721: ArtWhaleERC721Mock;
    let erc1155: ArtWhaleERC1155Mock;
    let ArtWhaleMarketplaceFactory: ContractFactory
    let ERC20TokenMockFactory: ContractFactory
    let ArtWhaleERC721MockFactory: ContractFactory
    let ArtWhaleERC1155MockFactory: ContractFactory

    beforeEach(async () => {
        signers = await ethers.getSigners();
        ArtWhaleMarketplaceFactory = await ethers.getContractFactory("ArtWhaleMarketplace");
        ERC20TokenMockFactory = await ethers.getContractFactory("ERC20TokenMock");
        ArtWhaleERC721MockFactory = await ethers.getContractFactory("ArtWhaleERC721Mock");
        ArtWhaleERC1155MockFactory = await ethers.getContractFactory("ArtWhaleERC1155Mock");
    });

    it('check state after deployment', async () => {
        // console.log(await artWhaleMarketplace.owner())
    });

    describe('order system', () => {
        // signer[0] -> onwer
        // signer[1] -> order maker
        // signer[2] -> buyer
        // signers[3] -> royalty recipient

        beforeEach(async () => {
            artWhaleMarketplace = await upgrades.deployProxy(ArtWhaleMarketplaceFactory, [
                ethers.constants.AddressZero,
                BigNumber.from('0'),
            ]) as ArtWhaleMarketplace;
            await artWhaleMarketplace.deployed();

            // settlement token
            erc20 = await ERC20TokenMockFactory.deploy("erc20Test", "ERC20TEST") as ERC20TokenMock;
            await erc20.deployed();
            await artWhaleMarketplace.addSettlementToken(erc20.address);
            await erc20.mintTo(signers[2].address, ethers.utils.parseEther('10000'));

            // erc721 nft
            erc721 = await ArtWhaleERC721MockFactory.deploy("erc721Test", "ERC721TEST") as ArtWhaleERC721Mock;
            await erc721.deployed();
            await artWhaleMarketplace.addToWhitelistErc721(erc721.address);
            await erc721.mintTo(signers[1].address, 1, 'ipfs://');  // tokenId = 1
            await erc721.mintTo(signers[1].address, 2, 'ipfs://');  // tokenId = 2

            // erc1155 nft
            erc1155 = await ArtWhaleERC1155MockFactory.deploy("erc1155Test", "ERC1155TEST") as ArtWhaleERC1155Mock;
            await artWhaleMarketplace.addToWhitelistErc1155(erc1155.address);
            await erc1155.deployed();
            await erc1155.mintTo(signers[1].address, 1, ethers.utils.parseEther('10000'));

        });

        describe('execute p2p order', () => {
            beforeEach(async () => {
                await erc721.connect(signers[1]).setApprovalForAll(artWhaleMarketplace.address, true);
                await artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    erc721.address,
                    1,
                    1,
                    erc20.address,
                    ethers.utils.parseEther('1'),
                    OrderType.P2P
                );  // orderId = 0

                await erc1155.connect(signers[1]).setApprovalForAll(artWhaleMarketplace.address, true);
                await artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    1,
                    1,
                    erc20.address,
                    ethers.utils.parseEther('1'),
                    OrderType.P2P
                );  // orderId = 1

                await erc20.connect(signers[2]).approve(artWhaleMarketplace.address, ethers.utils.parseEther('1000000000'));
            });
            it('with royalty & comission', async () => {
                await erc721.setDefaultRoyalty([{
                    receiver: signers[3].address,
                    royaltyFraction: BigNumber.from('100')
                }]); // 1%
                await artWhaleMarketplace.setTradeFeePercent('2'); // 2%
                
                expect(await erc721.ownerOf(1)).to.equal(artWhaleMarketplace.address);
                let balanceBeforeSeller = await erc20.balanceOf(signers[1].address);
                let balanceBeforeBuyer = await erc20.balanceOf(signers[2].address);
                let balanceBeforeCreator = await erc20.balanceOf(signers[3].address);

                await artWhaleMarketplace.connect(signers[2]).executeOrder(
                    0,
                    ethers.constants.AddressZero
                );

                expect(await erc721.ownerOf(1)).to.equal(signers[2].address);
                // byuer pays
                expect(await erc20.balanceOf(signers[2].address)).to.equal(balanceBeforeBuyer.sub(ethers.utils.parseEther('1')));
                // seller receives 
                // order price - protocol fee - royalty
                // (or 1 eth - 0.03 eth)
                expect(await erc20.balanceOf(signers[1].address)).to.equal(
                    balanceBeforeSeller.add(ethers.utils.parseEther('1')).sub(ethers.utils.parseEther('0.03'))
                );
                // creator receives
                // 0.01 eth (1%)
                expect(await erc20.balanceOf(signers[3].address)).to.equal(
                    balanceBeforeCreator.add(ethers.utils.parseEther('0.01'))
                );
            });
            it('only with royalty', async () => {

            });
            it('only with comission', async () => {

            });
            it('without royalty & comission', async () => {

            });
        });
    });

// contract('ArtBlockMarket', function (accounts) {

//     const [owner, account1, account2] = accounts;

//     function _orderStructToDict(order) {
//         return({
//             orderId: order.orderId,
//             nftStandart: order.nftStandart,
//             tokenContract: order.tokenContract,
//             tokenId: order.tokenId,
//             tokenAmount: order.tokenAmount,
//             settlementToken: order.settlementToken,
//             price: order.price,
//             status: order.status,
//             seller: order.seller,
//             buyer: order.buyer,
//         });
//     }


//     describe('constructor', function () {
//         it('positive', async function () {
//             //
//         });
//     });

//     // this.totalTokens = web3.utils.toWei("100000000000","ether");
//     // await this.erc20.mintTo(owner, this.totalTokens);
//     // await this.traidingToken.transfer(account2, this.totalTokens);
//     describe('create order', function () {
//         beforeEach(async function () {
//             this.erc20 = await ERC20Token.new("TEST", "TEST");
//             this.erc721 = await ArtWhaleERC721Mock.new("TEST", "TEST");
//             this.erc1155 = await ArtWhaleERC1155Mock.new("TEST", "TEST");

//             this.marketplace = await ArtBlockMarket.new();
//             await this.marketplace.initialize(this.erc20.address, '0');
//             await this.marketplace.addToWhitelistErc721(this.erc721.address);
//             await this.marketplace.addToWhitelistErc1155(this.erc1155.address);

//             await this.erc721.safeMint(account1, 'https://testuri');
//             this.erc721TokenId = await this.erc721.tokenOfOwnerByIndex(account1, 0);
//             this.erc1155TokenId = "0";
//             this.erc1155TokenAmount = "5";
//             await this.erc1155.createToken("100");
//             await this.erc1155.mintTo(account1, this.erc1155TokenId, this.erc1155TokenAmount, "0x");
//         });
//         it('create erc721 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");

//             await this.erc721.approve(this.marketplace.address, this.erc721TokenId, {from: account1});

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.NULL,
//                 tokenContract: ZERO_ADDRESS,
//                 tokenId: '0',
//                 tokenAmount: '0',
//                 settlementToken: ZERO_ADDRESS,
//                 price: '0',
//                 status: OrderStatus.NULL,
//                 seller: ZERO_ADDRESS,
//                 buyer: ZERO_ADDRESS,
//             });

//             const txReceipt = await this.marketplace.createOrder(
//                 NFTStandart.ERC721,
//                 this.erc721.address,
//                 this.erc721TokenId,
//                 "1",
//                 this.erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC721,
//                 tokenContract: this.erc721.address,
//                 tokenId: '0',
//                 tokenAmount: '1',
//                 settlementToken: this.erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.OPEN,
//                 seller: account1,
//                 buyer: ZERO_ADDRESS,
//             });

//         });

//         it('create erc1155 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");
//             await this.erc1155.setApprovalForAll(this.marketplace.address, true, {from: account1});

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc1155TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.NULL,
//                 tokenContract: ZERO_ADDRESS,
//                 tokenId: '0',
//                 tokenAmount: '0',
//                 settlementToken: ZERO_ADDRESS,
//                 price: '0',
//                 status: OrderStatus.NULL,
//                 seller: ZERO_ADDRESS,
//                 buyer: ZERO_ADDRESS,
//             });

//             const txReceipt = await this.marketplace.createOrder(
//                 NFTStandart.ERC1155,
//                 this.erc1155.address,
//                 this.erc1155TokenId,
//                 this.erc1155TokenAmount,
//                 this.erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC1155,
//                 tokenContract: this.erc1155.address,
//                 tokenId: '0',
//                 tokenAmount: this.erc1155TokenAmount,
//                 settlementToken: this.erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.OPEN,
//                 seller: account1,
//                 buyer: ZERO_ADDRESS,
//             });

//         });

//     });

//     describe('execute order', function () {
//         beforeEach(async function () {
//             this.erc20 = await ERC20Token.new("TEST", "TEST");
//             this.erc721 = await ArtWhaleERC721Mock.new("TEST", "TEST");
//             this.erc1155 = await ArtWhaleERC1155Mock.new("TEST", "TEST");

//             this.marketplace = await ArtBlockMarket.new();
//             await this.marketplace.initialize(this.erc20.address, '0');
//             await this.marketplace.addToWhitelistErc721(this.erc721.address);
//             await this.marketplace.addToWhitelistErc1155(this.erc1155.address);

//             await this.erc721.safeMint(account1, 'https://testuri');
//             this.erc721TokenId = await this.erc721.tokenOfOwnerByIndex(account1, 0);
//             this.erc1155TokenId = "0";
//             this.erc1155TokenAmount = "5";
//             await this.erc1155.createToken("100");
//             await this.erc1155.mintTo(account1, this.erc1155TokenId, this.erc1155TokenAmount, "0x");

//             await this.erc20.mintTo(account2, web3.utils.toWei("100","ether"));
//         });
//         it('execute erc721 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");

//             await this.erc721.approve(this.marketplace.address, this.erc721TokenId, {from: account1});

//             await this.marketplace.createOrder(
//                 NFTStandart.ERC721,
//                 this.erc721.address,
//                 this.erc721TokenId,
//                 "1",
//                 this.erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC721,
//                 tokenContract: this.erc721.address,
//                 tokenId: '0',
//                 tokenAmount: '1',
//                 settlementToken: this.erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.OPEN,
//                 seller: account1,
//                 buyer: ZERO_ADDRESS,
//             });

//             await this.erc20.approve(this.marketplace.address, orderPrice, {from: account2});

//             const txReceipt = await this.marketplace.executeOrder("0", ZERO_ADDRESS, {from: account2});

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC721,
//                 tokenContract: this.erc721.address,
//                 tokenId: '0',
//                 tokenAmount: '1',
//                 settlementToken: this.erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.EXECUTED,
//                 seller: account1,
//                 buyer: account2,
//             });

//         });

//         it('create erc1155 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");
//             await this.erc1155.setApprovalForAll(this.marketplace.address, true, {from: account1});

//             await this.marketplace.createOrder(
//                 NFTStandart.ERC1155,
//                 this.erc1155.address,
//                 this.erc1155TokenId,
//                 this.erc1155TokenAmount,
//                 this.erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             await this.erc20.approve(this.marketplace.address, orderPrice, {from: account2});

//             const txReceipt = await this.marketplace.executeOrder("0", ZERO_ADDRESS, {from: account2});

//             expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC1155,
//                 tokenContract: this.erc1155.address,
//                 tokenId: '0',
//                 tokenAmount: this.erc1155TokenAmount,
//                 settlementToken: this.erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.EXECUTED,
//                 seller: account1,
//                 buyer: account2,
//             });

//         });

//     });

});