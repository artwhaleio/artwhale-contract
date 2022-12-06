const { expect } = require('chai');
const { BN, expectRevert, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const ArtBlockMarket = artifacts.require('ArtBlockMarket');
const ERC20Token = artifacts.require('ERC20Token');
const ArtWhaleERC721Mock = artifacts.require('ArtWhaleERC721Mock');
const ERC1155Token = artifacts.require('ERC1155Token');

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

contract('ArtBlockMarket', function (accounts) {

    const [owner, account1, account2] = accounts;

    function _orderStructToDict(order) {
        return({
            orderId: order.orderId,
            nftStandart: order.nftStandart,
            tokenContract: order.tokenContract,
            tokenId: order.tokenId,
            tokenAmount: order.tokenAmount,
            settlementToken: order.settlementToken,
            price: order.price,
            status: order.status,
            seller: order.seller,
            buyer: order.buyer,
        });
    }


    describe('constructor', function () {
        it('positive', async function () {
            //
        });
    });

    // this.totalTokens = web3.utils.toWei("100000000000","ether");
    // await this.erc20.mint(owner, this.totalTokens);
    // await this.traidingToken.transfer(account2, this.totalTokens);
    describe('create order', function () {
        beforeEach(async function () {
            this.erc20 = await ERC20Token.new("TEST", "TEST");
            this.erc721 = await ArtWhaleERC721Mock.new("TEST", "TEST");
            this.erc1155 = await ERC1155Token.new("TEST", "TEST");

            this.marketplace = await ArtBlockMarket.new();
            await this.marketplace.initialize(this.erc20.address, '0');
            await this.marketplace.addToWhitelistErc721(this.erc721.address);
            await this.marketplace.addToWhitelistErc1155(this.erc1155.address);

            await this.erc721.safeMint(account1, 'https://testuri');
            this.erc721TokenId = await this.erc721.tokenOfOwnerByIndex(account1, 0);
            this.erc1155TokenId = "0";
            this.erc1155TokenAmount = "5";
            await this.erc1155.createToken("100");
            await this.erc1155.mint(account1, this.erc1155TokenId, this.erc1155TokenAmount, "0x");
        });
        it('create erc721 order', async function () {
            const orderPrice = web3.utils.toWei("100","ether");

            await this.erc721.approve(this.marketplace.address, this.erc721TokenId, {from: account1});

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.NULL,
                tokenContract: ZERO_ADDRESS,
                tokenId: '0',
                tokenAmount: '0',
                settlementToken: ZERO_ADDRESS,
                price: '0',
                status: OrderStatus.NULL,
                seller: ZERO_ADDRESS,
                buyer: ZERO_ADDRESS,
            });

            const txReceipt = await this.marketplace.createOrder(
                NFTStandart.ERC721,
                this.erc721.address,
                this.erc721TokenId,
                "1",
                this.erc20.address,
                orderPrice,
                0,
                {from: account1}
            );

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.ERC721,
                tokenContract: this.erc721.address,
                tokenId: '0',
                tokenAmount: '1',
                settlementToken: this.erc20.address,
                price: orderPrice,
                status: OrderStatus.OPEN,
                seller: account1,
                buyer: ZERO_ADDRESS,
            });

        });

        it('create erc1155 order', async function () {
            const orderPrice = web3.utils.toWei("100","ether");
            await this.erc1155.setApprovalForAll(this.marketplace.address, true, {from: account1});

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc1155TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.NULL,
                tokenContract: ZERO_ADDRESS,
                tokenId: '0',
                tokenAmount: '0',
                settlementToken: ZERO_ADDRESS,
                price: '0',
                status: OrderStatus.NULL,
                seller: ZERO_ADDRESS,
                buyer: ZERO_ADDRESS,
            });

            const txReceipt = await this.marketplace.createOrder(
                NFTStandart.ERC1155,
                this.erc1155.address,
                this.erc1155TokenId,
                this.erc1155TokenAmount,
                this.erc20.address,
                orderPrice,
                0,
                {from: account1}
            );

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.ERC1155,
                tokenContract: this.erc1155.address,
                tokenId: '0',
                tokenAmount: this.erc1155TokenAmount,
                settlementToken: this.erc20.address,
                price: orderPrice,
                status: OrderStatus.OPEN,
                seller: account1,
                buyer: ZERO_ADDRESS,
            });

        });

    });

    describe('execute order', function () {
        beforeEach(async function () {
            this.erc20 = await ERC20Token.new("TEST", "TEST");
            this.erc721 = await ArtWhaleERC721Mock.new("TEST", "TEST");
            this.erc1155 = await ERC1155Token.new("TEST", "TEST");

            this.marketplace = await ArtBlockMarket.new();
            await this.marketplace.initialize(this.erc20.address, '0');
            await this.marketplace.addToWhitelistErc721(this.erc721.address);
            await this.marketplace.addToWhitelistErc1155(this.erc1155.address);

            await this.erc721.safeMint(account1, 'https://testuri');
            this.erc721TokenId = await this.erc721.tokenOfOwnerByIndex(account1, 0);
            this.erc1155TokenId = "0";
            this.erc1155TokenAmount = "5";
            await this.erc1155.createToken("100");
            await this.erc1155.mint(account1, this.erc1155TokenId, this.erc1155TokenAmount, "0x");

            await this.erc20.mint(account2, web3.utils.toWei("100","ether"));
        });
        it('execute erc721 order', async function () {
            const orderPrice = web3.utils.toWei("100","ether");

            await this.erc721.approve(this.marketplace.address, this.erc721TokenId, {from: account1});

            await this.marketplace.createOrder(
                NFTStandart.ERC721,
                this.erc721.address,
                this.erc721TokenId,
                "1",
                this.erc20.address,
                orderPrice,
                0,
                {from: account1}
            );

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.ERC721,
                tokenContract: this.erc721.address,
                tokenId: '0',
                tokenAmount: '1',
                settlementToken: this.erc20.address,
                price: orderPrice,
                status: OrderStatus.OPEN,
                seller: account1,
                buyer: ZERO_ADDRESS,
            });

            await this.erc20.approve(this.marketplace.address, orderPrice, {from: account2});

            const txReceipt = await this.marketplace.executeOrder("0", ZERO_ADDRESS, {from: account2});

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.ERC721,
                tokenContract: this.erc721.address,
                tokenId: '0',
                tokenAmount: '1',
                settlementToken: this.erc20.address,
                price: orderPrice,
                status: OrderStatus.EXECUTED,
                seller: account1,
                buyer: account2,
            });

        });

        it('create erc1155 order', async function () {
            const orderPrice = web3.utils.toWei("100","ether");
            await this.erc1155.setApprovalForAll(this.marketplace.address, true, {from: account1});

            await this.marketplace.createOrder(
                NFTStandart.ERC1155,
                this.erc1155.address,
                this.erc1155TokenId,
                this.erc1155TokenAmount,
                this.erc20.address,
                orderPrice,
                0,
                {from: account1}
            );

            await this.erc20.approve(this.marketplace.address, orderPrice, {from: account2});

            const txReceipt = await this.marketplace.executeOrder("0", ZERO_ADDRESS, {from: account2});

            expect(_orderStructToDict(await this.marketplace.orderDetails.call(this.erc721TokenId))).to.deep.equal({
                orderId: '0',
                nftStandart: NFTStandart.ERC1155,
                tokenContract: this.erc1155.address,
                tokenId: '0',
                tokenAmount: this.erc1155TokenAmount,
                settlementToken: this.erc20.address,
                price: orderPrice,
                status: OrderStatus.EXECUTED,
                seller: account1,
                buyer: account2,
            });

        });

    });

});