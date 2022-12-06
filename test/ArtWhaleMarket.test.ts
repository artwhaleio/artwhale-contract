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
    P2P: 0,
    AUTHORITY: 1,
}

const OrderStatus = {
    NULL: 0,
    OPEN: 1,
    CANCELLED: 2,
    EXECUTED: 3,
    ANY: 4,
}

const NFTStandart = {
    NULL: 0,
    ERC721: 1,
    ERC1155: 2,
}

function _orderStructToDict(order: any) {
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

    describe('settings', () => {
        beforeEach(async () => {
            artWhaleMarketplace = await upgrades.deployProxy(ArtWhaleMarketplaceFactory, [
                ethers.constants.AddressZero,
                BigNumber.from('0'),
            ]) as ArtWhaleMarketplace;
            await artWhaleMarketplace.deployed();
        });

        it('check state after deployment', async () => {
            // console.log(await artWhaleMarketplace.owner())
            // TODO
            expect(await artWhaleMarketplace.name()).to.equal("ArtWhale Marketplace");
        });

        describe('withdraw token', function () {
            it('erc20', async function () {
                erc20 = await ERC20TokenMockFactory.deploy("TEST1", "TEST1") as ERC20TokenMock;
                await erc20.deployed();
                const tokenAmount = ethers.utils.parseEther("100");
    
                await erc20.mintTo(artWhaleMarketplace.address, tokenAmount);
                expect(await erc20.balanceOf(artWhaleMarketplace.address)).to.equal(tokenAmount);
    
                await artWhaleMarketplace.withdrawERC20(
                    erc20.address,
                    tokenAmount
                );
                
                expect(await erc20.balanceOf(artWhaleMarketplace.address)).to.equal("0");

                await expect(artWhaleMarketplace.connect(signers[1]).withdrawERC20(
                    erc20.address,
                    tokenAmount
                )).to.be.revertedWith("Ownable: caller is not the owner");
            });
            it('ether', async function () {
                const tokenAmount = ethers.utils.parseEther("100");
                const tokenAmountHex = tokenAmount.toHexString().replace("0x0", "0x");
                await ethers.provider.send("hardhat_setBalance", [
                    artWhaleMarketplace.address,
                    tokenAmountHex,
                ]);
    
                expect(await ethers.provider.getBalance(artWhaleMarketplace.address)).to.equal(tokenAmount);
    
                await artWhaleMarketplace.withdrawERC20(
                    ethers.constants.AddressZero,
                    tokenAmount
                );
    
                expect(await ethers.provider.getBalance(artWhaleMarketplace.address)).to.equal("0");

                await expect(artWhaleMarketplace.connect(signers[1]).withdrawERC20(
                    erc20.address,
                    tokenAmount
                )).to.be.revertedWith("Ownable: caller is not the owner");
            });
        });

        describe('settlement tokens', function () {
            let erc20First: ERC20TokenMock;
            let erc20Second: ERC20TokenMock;

            beforeEach(async function () {
                erc20First = await ERC20TokenMockFactory.deploy("TEST1", "TEST1") as ERC20TokenMock;
                erc20Second = await ERC20TokenMockFactory.deploy("TEST2", "TEST2") as ERC20TokenMock;
                await erc20First.deployed();
                await erc20Second.deployed();
            });
            it('add', async function () {
                expect(await artWhaleMarketplace.containsSettlementToken(erc20First.address)).to.equal(false);
                expect(await artWhaleMarketplace.containsSettlementToken(erc20Second.address)).to.equal(false);
                expect(await artWhaleMarketplace.getSettlementTokens()).to.deep.equal([ethers.constants.AddressZero]);
    
                await artWhaleMarketplace.addSettlementToken(
                    erc20Second.address
                );
    
                expect(await artWhaleMarketplace.containsSettlementToken(erc20First.address)).to.equal(false);
                expect(await artWhaleMarketplace.containsSettlementToken(erc20Second.address)).to.equal(true);
                expect(await artWhaleMarketplace.getSettlementTokens()).to.deep.equal([ethers.constants.AddressZero, erc20Second.address]);

                await expect(artWhaleMarketplace.connect(signers[1]).addSettlementToken(
                    erc20First.address
                )).to.be.revertedWith("Ownable: caller is not the owner");
            });
            it('remove', async function () {
                expect(await artWhaleMarketplace.containsSettlementToken(erc20First.address)).to.equal(false);
                expect(await artWhaleMarketplace.containsSettlementToken(erc20Second.address)).to.equal(false);
                expect(await artWhaleMarketplace.getSettlementTokens()).to.deep.equal([ethers.constants.AddressZero]);
    
                await artWhaleMarketplace.addSettlementToken(
                    erc20Second.address,
                );
                await artWhaleMarketplace.removeSettlementToken(
                    erc20First.address,
                );
                await artWhaleMarketplace.removeSettlementToken(
                    erc20Second.address,
                );
    
                expect(await artWhaleMarketplace.containsSettlementToken(erc20First.address)).to.equal(false);
                expect(await artWhaleMarketplace.containsSettlementToken(erc20Second.address)).to.equal(false);
                expect(await artWhaleMarketplace.getSettlementTokens()).to.deep.equal([ethers.constants.AddressZero]);
                
                await expect(artWhaleMarketplace.connect(signers[1]).removeSettlementToken(
                    erc20First.address
                )).to.be.revertedWith("Ownable: caller is not the owner");
            });
        });

        it('fee percentage', async function () {
    
            expect(await artWhaleMarketplace.tradeFeePercent()).to.equal('0');
    
            await artWhaleMarketplace.setTradeFeePercent(
                "99",
            );
    
            expect(await artWhaleMarketplace.tradeFeePercent()).to.equal('99');

            await expect(
                artWhaleMarketplace.setTradeFeePercent("100")
            ).to.be.revertedWith("ArtWhaleMarketplace: wrong percent value");
            await expect(
                artWhaleMarketplace.connect(signers[1]).setTradeFeePercent("1")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        describe('whitelist erc1155', function () {
            beforeEach(async () => {
                erc1155 = await ArtWhaleERC1155MockFactory.deploy("erc1155Test", "ERC1155TEST") as ArtWhaleERC1155Mock;
                await erc1155.deployed();
            });
            it('add', async function () {
                expect(await artWhaleMarketplace.containsWhitelistErc1155(erc1155.address)).to.equal(false);
                expect(await artWhaleMarketplace.getWhitelistErc1155()).to.deep.equal([]);
    
                await artWhaleMarketplace.addToWhitelistErc1155(
                    erc1155.address,
                );
    
                expect(await artWhaleMarketplace.containsWhitelistErc1155(erc1155.address)).to.equal(true);
                expect(await artWhaleMarketplace.getWhitelistErc1155()).to.deep.equal([erc1155.address]);

                await expect(
                    artWhaleMarketplace.connect(signers[1]).addToWhitelistErc1155(erc1155.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");                
            });
            it('remove', async function () {
                expect(await artWhaleMarketplace.containsWhitelistErc1155(erc1155.address)).to.equal(false);
                expect(await artWhaleMarketplace.getWhitelistErc1155()).to.deep.equal([]);
    
                await artWhaleMarketplace.addToWhitelistErc1155(
                    erc1155.address,
                );
                await artWhaleMarketplace.removeFromWhitelistErc1155(
                    erc1155.address,
                );
    
                expect(await artWhaleMarketplace.containsWhitelistErc1155(erc1155.address)).to.equal(false);
                expect(await artWhaleMarketplace.getWhitelistErc1155()).to.deep.equal([]);

                await expect(
                    artWhaleMarketplace.connect(signers[1]).removeFromWhitelistErc1155(erc1155.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");     
            });
        });    

        describe('whitelist erc721', function () {
            beforeEach(async () => {
                erc721 = await ArtWhaleERC721MockFactory.deploy("erc721Test", "ERC721TEST") as ArtWhaleERC721Mock;
                await erc721.deployed();
            });
            it('add', async function () {
                expect(await artWhaleMarketplace.containsWhitelistErc721(erc721.address)).to.equal(false);
                expect(await artWhaleMarketplace.getWhitelistErc721()).to.deep.equal([]);
    
                await artWhaleMarketplace.addToWhitelistErc721(
                    erc721.address
                );
    
                expect(await artWhaleMarketplace.containsWhitelistErc721(erc721.address)).to.equal(true);
                expect(await artWhaleMarketplace.getWhitelistErc721()).to.deep.equal([erc721.address]);

                await expect(
                    artWhaleMarketplace.connect(signers[1]).addToWhitelistErc721(erc1155.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");     
            });
            it('remove', async function () {
                expect(await artWhaleMarketplace.containsWhitelistErc721(erc721.address)).to.equal(false);
                expect(await artWhaleMarketplace.getWhitelistErc721()).to.deep.equal([]);
    
                await artWhaleMarketplace.addToWhitelistErc721(
                    erc721.address
                );
                await artWhaleMarketplace.removeFromWhitelistErc721(
                    erc721.address,
                );
    
                expect(await artWhaleMarketplace.containsWhitelistErc721(erc721.address)).to.equal(false);
                expect(await artWhaleMarketplace.getWhitelistErc721()).to.deep.equal([]);

                await expect(
                    artWhaleMarketplace.connect(signers[1]).removeFromWhitelistErc721(erc1155.address)
                ).to.be.revertedWith("Ownable: caller is not the owner");    
            });
        });
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
            await erc1155.deployed();
            await artWhaleMarketplace.addToWhitelistErc1155(erc1155.address);
            await erc1155.mintTo(signers[1].address, 1, ethers.utils.parseEther('10000'));

        });
        describe('create order', () => {
            it('erc721', async function () {
                const orderPrice = ethers.utils.parseEther("100");

                await erc721.connect(signers[1]).setApprovalForAll(artWhaleMarketplace.address, true);
    
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.ANY)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.CANCELLED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.EXECUTED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.OPEN)).to.equal(0);
                const expectedDetails = {
                    orderId: BigNumber.from('0'),
                    nftStandart: NFTStandart.NULL,
                    tokenContract: ethers.constants.AddressZero,
                    tokenId: BigNumber.from('0'),
                    tokenAmount: BigNumber.from('0'),
                    settlementToken: ethers.constants.AddressZero,
                    price: BigNumber.from('0'),
                    status: OrderStatus.NULL,
                    seller: ethers.constants.AddressZero,
                    buyer: ethers.constants.AddressZero,
                };
                expect(_orderStructToDict(await artWhaleMarketplace.orderDetails("0"))).to.deep.equal(expectedDetails);
                expect(_orderStructToDict((await artWhaleMarketplace.orderDetailsBatch(["0"]))[0])).to.deep.equal(expectedDetails);
                
                await artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    erc721.address,
                    1,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                );
                
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.ANY)).to.equal(1);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.CANCELLED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.EXECUTED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.OPEN)).to.equal(1);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](4, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](3, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](2, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](1, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,4, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,3, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,2, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,1, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,4, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,3, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,2, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,1, 0, 10)).orderIds).to.deep.equal([]);

                const expectedResults = {
                    orderId: BigNumber.from('0'),
                    nftStandart: NFTStandart.ERC721,
                    tokenContract: erc721.address,
                    tokenId: BigNumber.from('1'),
                    tokenAmount: BigNumber.from('1'),
                    settlementToken: erc20.address,
                    price: orderPrice,
                    status: OrderStatus.OPEN,
                    seller: signers[1].address,
                    buyer: ethers.constants.AddressZero,
                };
                expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(0))).to.deep.equal(expectedResults);
                expect(_orderStructToDict((await artWhaleMarketplace.orderDetailsBatch(["0"]))[0])).to.deep.equal(expectedResults);
                
                //
                // negative cases
                //

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.NULL,
                    erc721.address,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong nft standart")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    ethers.constants.AddressZero,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: zero contract address")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    erc1155.address,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: nft not registered")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    erc721.address,
                    0,
                    2,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong token amount")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc721.address,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: nft not registered")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    0,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong token amount")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    1,
                    ethers.constants.AddressZero,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: zero trade token address")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    1,
                    signers[2].address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: settlement token not registered")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    1,
                    erc20.address,
                    0,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong price")
            });
            it('erc1155', async function () {
                const orderPrice = ethers.utils.parseEther("100");

                await erc1155.connect(signers[1]).setApprovalForAll(artWhaleMarketplace.address, true);
    
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.ANY)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.CANCELLED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.EXECUTED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.OPEN)).to.equal(0);
                const expectedDetails = {
                    orderId: BigNumber.from('0'),
                    nftStandart: NFTStandart.NULL,
                    tokenContract: ethers.constants.AddressZero,
                    tokenId: BigNumber.from('0'),
                    tokenAmount: BigNumber.from('0'),
                    settlementToken: ethers.constants.AddressZero,
                    price: BigNumber.from('0'),
                    status: OrderStatus.NULL,
                    seller: ethers.constants.AddressZero,
                    buyer: ethers.constants.AddressZero,
                };
                expect(_orderStructToDict(await artWhaleMarketplace.orderDetails("0"))).to.deep.equal(expectedDetails);
                expect(_orderStructToDict((await artWhaleMarketplace.orderDetailsBatch(["0"]))[0])).to.deep.equal(expectedDetails);
                
                await artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    1,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                );
                
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.ANY)).to.equal(1);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.CANCELLED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.EXECUTED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.OPEN)).to.equal(1);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](4, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](3, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](2, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](1, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,4, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,3, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,2, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,1, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,4, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,3, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,2, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,1, 0, 10)).orderIds).to.deep.equal([]);

                const expectedResults = {
                    orderId: BigNumber.from('0'),
                    nftStandart: NFTStandart.ERC1155,
                    tokenContract: erc1155.address,
                    tokenId: BigNumber.from('1'),
                    tokenAmount: BigNumber.from('1'),
                    settlementToken: erc20.address,
                    price: orderPrice,
                    status: OrderStatus.OPEN,
                    seller: signers[1].address,
                    buyer: ethers.constants.AddressZero,
                };
                expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(0))).to.deep.equal(expectedResults);
                expect(_orderStructToDict((await artWhaleMarketplace.orderDetailsBatch(["0"]))[0])).to.deep.equal(expectedResults);
                
                //
                // negative cases
                //

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.NULL,
                    erc1155.address,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong nft standart")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    ethers.constants.AddressZero,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: zero contract address")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc721.address,
                    0,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: nft not registered")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    0,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong token amount")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    1,
                    ethers.constants.AddressZero,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: zero trade token address")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    1,
                    signers[2].address,
                    orderPrice,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: settlement token not registered")

                await expect(artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    0,
                    1,
                    erc20.address,
                    0,
                    OrderType.P2P
                )).to.be.revertedWith("ArtWhaleMarketplace: wrong price")
            });
        });

        describe('cancel order', () => {
            it('erc721', async function () {
                const orderPrice = ethers.utils.parseEther("100");

                await erc721.connect(signers[1]).setApprovalForAll(artWhaleMarketplace.address, true);
                await artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC721,
                    erc721.address,
                    1,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                );

                //
                // negative cases
                //

                await expect(artWhaleMarketplace.connect(
                    signers[1]
                ).cancelOrder(1)).to.be.revertedWith("ArtWhaleMarketplace: order does not exist");
                await expect(artWhaleMarketplace.connect(
                    signers[2]
                ).cancelOrder(0)).to.be.revertedWith("ArtWhaleMarketplace: sender is not the seller");

                //
                // positive case
                //

                await artWhaleMarketplace.connect(signers[1]).cancelOrder(0);
                
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.ANY)).to.equal(1);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.CANCELLED)).to.equal(1);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.EXECUTED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.OPEN)).to.equal(0);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.ANY, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.EXECUTED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.CANCELLED, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.OPEN, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.ANY, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.EXECUTED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.CANCELLED, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.OPEN, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.ANY, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.EXECUTED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.CANCELLED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.OPEN, 0, 10)).orderIds).to.deep.equal([]);

                const expectedResults = {
                    orderId: BigNumber.from('0'),
                    nftStandart: NFTStandart.ERC721,
                    tokenContract: erc721.address,
                    tokenId: BigNumber.from('1'),
                    tokenAmount: BigNumber.from('1'),
                    settlementToken: erc20.address,
                    price: orderPrice,
                    status: OrderStatus.CANCELLED,
                    seller: signers[1].address,
                    buyer: ethers.constants.AddressZero,
                };
                expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(0))).to.deep.equal(expectedResults);
                expect(_orderStructToDict((await artWhaleMarketplace.orderDetailsBatch(["0"]))[0])).to.deep.equal(expectedResults);

                await expect(artWhaleMarketplace.connect(
                    signers[2]
                ).cancelOrder(0)).to.be.revertedWith("ArtWhaleMarketplace: only for open orders");
            });
            it('erc1155', async function () {
                const orderPrice = ethers.utils.parseEther("100");

                await erc1155.connect(signers[1]).setApprovalForAll(artWhaleMarketplace.address, true);
                await artWhaleMarketplace.connect(signers[1]).createOrder(
                    NFTStandart.ERC1155,
                    erc1155.address,
                    1,
                    1,
                    erc20.address,
                    orderPrice,
                    OrderType.P2P
                );

                //
                // negative cases
                //

                await expect(artWhaleMarketplace.connect(
                    signers[1]
                ).cancelOrder(1)).to.be.revertedWith("ArtWhaleMarketplace: order does not exist");
                await expect(artWhaleMarketplace.connect(
                    signers[2]
                ).cancelOrder(0)).to.be.revertedWith("ArtWhaleMarketplace: sender is not the seller");

                //
                // positive case
                //

                await artWhaleMarketplace.connect(signers[1]).cancelOrder(0);
                
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.ANY)).to.equal(1);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.CANCELLED)).to.equal(1);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.EXECUTED)).to.equal(0);
                expect(await artWhaleMarketplace.totalOrders(OrderStatus.OPEN)).to.equal(0);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect(await artWhaleMarketplace.orderType(0)).to.equal(OrderType.P2P);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.ANY, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.EXECUTED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.CANCELLED, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(uint8,uint256,uint256)"](OrderStatus.OPEN, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.ANY, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.EXECUTED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.CANCELLED, 0, 10)).orderIds).to.deep.equal([0]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[1].address,OrderStatus.OPEN, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.ANY, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.EXECUTED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.CANCELLED, 0, 10)).orderIds).to.deep.equal([]);
                expect((await artWhaleMarketplace["fetchOrdersBy(address,uint8,uint256,uint256)"](signers[0].address,OrderStatus.OPEN, 0, 10)).orderIds).to.deep.equal([]);

                const expectedResults = {
                    orderId: BigNumber.from('0'),
                    nftStandart: NFTStandart.ERC1155,
                    tokenContract: erc1155.address,
                    tokenId: BigNumber.from('1'),
                    tokenAmount: BigNumber.from('1'),
                    settlementToken: erc20.address,
                    price: orderPrice,
                    status: OrderStatus.CANCELLED,
                    seller: signers[1].address,
                    buyer: ethers.constants.AddressZero,
                };
                expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(0))).to.deep.equal(expectedResults);
                expect(_orderStructToDict((await artWhaleMarketplace.orderDetailsBatch(["0"]))[0])).to.deep.equal(expectedResults);

                await expect(artWhaleMarketplace.connect(
                    signers[2]
                ).cancelOrder(0)).to.be.revertedWith("ArtWhaleMarketplace: only for open orders");
            });
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

                // negative case
                await expect(artWhaleMarketplace.connect(signers[1]).executeOrder(
                    0,
                    ethers.constants.AddressZero,
                )).to.be.revertedWith("ArtWhaleMarketplace: not for seller");

                // positive case
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

                // negative cases
                await expect(artWhaleMarketplace.connect(signers[2]).executeOrder(
                    2,
                    ethers.constants.AddressZero,
                )).to.be.revertedWith("ArtWhaleMarketplace: order does not exist");
                await expect(artWhaleMarketplace.connect(signers[2]).executeOrder(
                    0,
                    ethers.constants.AddressZero,
                )).to.be.revertedWith("ArtWhaleMarketplace: only for open orders");
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
//     // await erc20.mintTo(owner, this.totalTokens);
//     // await this.traidingToken.transfer(account2, this.totalTokens);
//     describe('create order', function () {
//         beforeEach(async function () {
//             erc20 = await ERC20Token.new("TEST", "TEST");
//             erc721 = await ArtWhaleERC721Mock.new("TEST", "TEST");
//             erc1155 = await ArtWhaleERC1155Mock.new("TEST", "TEST");

//             artWhaleMarketplace = await ArtBlockMarket.new();
//             await artWhaleMarketplace.initialize(erc20.address, '0');
//             await artWhaleMarketplace.addToWhitelistErc721(erc721.address);
//             await artWhaleMarketplace.addToWhitelistErc1155(erc1155.address);

//             await erc721.safeMint(account1, 'https://testuri');
//             erc721TokenId = await erc721.tokenOfOwnerByIndex(account1, 0);
//             erc1155TokenId = "0";
//             erc1155TokenAmount = "5";
//             await erc1155.createToken("100");
//             await erc1155.mintTo(account1, erc1155TokenId, erc1155TokenAmount, "0x");
//         });
//         it('create erc721 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");

//             await erc721.approve(artWhaleMarketplace.address, erc721TokenId, {from: account1});

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.NULL,
//                 tokenContract: ethers.constants.AddressZero,
//                 tokenId: '0',
//                 tokenAmount: '0',
//                 settlementToken: ethers.constants.AddressZero,
//                 price: '0',
//                 status: OrderStatus.NULL,
//                 seller: ethers.constants.AddressZero,
//                 buyer: ethers.constants.AddressZero,
//             });

//             const txReceipt = await artWhaleMarketplace.createOrder(
//                 NFTStandart.ERC721,
//                 erc721.address,
//                 erc721TokenId,
//                 "1",
//                 erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC721,
//                 tokenContract: erc721.address,
//                 tokenId: '0',
//                 tokenAmount: '1',
//                 settlementToken: erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.OPEN,
//                 seller: account1,
//                 buyer: ethers.constants.AddressZero,
//             });

//         });

//         it('create erc1155 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");
//             await erc1155.setApprovalForAll(artWhaleMarketplace.address, true, {from: account1});

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc1155TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.NULL,
//                 tokenContract: ethers.constants.AddressZero,
//                 tokenId: '0',
//                 tokenAmount: '0',
//                 settlementToken: ethers.constants.AddressZero,
//                 price: '0',
//                 status: OrderStatus.NULL,
//                 seller: ethers.constants.AddressZero,
//                 buyer: ethers.constants.AddressZero,
//             });

//             const txReceipt = await artWhaleMarketplace.createOrder(
//                 NFTStandart.ERC1155,
//                 erc1155.address,
//                 erc1155TokenId,
//                 erc1155TokenAmount,
//                 erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC1155,
//                 tokenContract: erc1155.address,
//                 tokenId: '0',
//                 tokenAmount: erc1155TokenAmount,
//                 settlementToken: erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.OPEN,
//                 seller: account1,
//                 buyer: ethers.constants.AddressZero,
//             });

//         });

//     });

//     describe('execute order', function () {
//         beforeEach(async function () {
//             erc20 = await ERC20Token.new("TEST", "TEST");
//             erc721 = await ArtWhaleERC721Mock.new("TEST", "TEST");
//             erc1155 = await ArtWhaleERC1155Mock.new("TEST", "TEST");

//             artWhaleMarketplace = await ArtBlockMarket.new();
//             await artWhaleMarketplace.initialize(erc20.address, '0');
//             await artWhaleMarketplace.addToWhitelistErc721(erc721.address);
//             await artWhaleMarketplace.addToWhitelistErc1155(erc1155.address);

//             await erc721.safeMint(account1, 'https://testuri');
//             erc721TokenId = await erc721.tokenOfOwnerByIndex(account1, 0);
//             erc1155TokenId = "0";
//             erc1155TokenAmount = "5";
//             await erc1155.createToken("100");
//             await erc1155.mintTo(account1, erc1155TokenId, erc1155TokenAmount, "0x");

//             await erc20.mintTo(account2, web3.utils.toWei("100","ether"));
//         });
//         it('execute erc721 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");

//             await erc721.approve(artWhaleMarketplace.address, erc721TokenId, {from: account1});

//             await artWhaleMarketplace.createOrder(
//                 NFTStandart.ERC721,
//                 erc721.address,
//                 erc721TokenId,
//                 "1",
//                 erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC721,
//                 tokenContract: erc721.address,
//                 tokenId: '0',
//                 tokenAmount: '1',
//                 settlementToken: erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.OPEN,
//                 seller: account1,
//                 buyer: ethers.constants.AddressZero,
//             });

//             await erc20.approve(artWhaleMarketplace.address, orderPrice, {from: account2});

//             const txReceipt = await artWhaleMarketplace.executeOrder("0", ethers.constants.AddressZero, {from: account2});

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC721,
//                 tokenContract: erc721.address,
//                 tokenId: '0',
//                 tokenAmount: '1',
//                 settlementToken: erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.EXECUTED,
//                 seller: account1,
//                 buyer: account2,
//             });

//         });

//         it('create erc1155 order', async function () {
//             const orderPrice = web3.utils.toWei("100","ether");
//             await erc1155.setApprovalForAll(artWhaleMarketplace.address, true, {from: account1});

//             await artWhaleMarketplace.createOrder(
//                 NFTStandart.ERC1155,
//                 erc1155.address,
//                 erc1155TokenId,
//                 erc1155TokenAmount,
//                 erc20.address,
//                 orderPrice,
//                 0,
//                 {from: account1}
//             );

//             await erc20.approve(artWhaleMarketplace.address, orderPrice, {from: account2});

//             const txReceipt = await artWhaleMarketplace.executeOrder("0", ethers.constants.AddressZero, {from: account2});

//             expect(_orderStructToDict(await artWhaleMarketplace.orderDetails(erc721TokenId))).to.deep.equal({
//                 orderId: '0',
//                 nftStandart: NFTStandart.ERC1155,
//                 tokenContract: erc1155.address,
//                 tokenId: '0',
//                 tokenAmount: erc1155TokenAmount,
//                 settlementToken: erc20.address,
//                 price: orderPrice,
//                 status: OrderStatus.EXECUTED,
//                 seller: account1,
//                 buyer: account2,
//             });

//         });

//     });

});
