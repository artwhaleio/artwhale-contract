// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.13;

// solhint-disable not-rely-on-time, max-states-count

import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interface/IArtWhaleMarketplace.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "./interface/IRoyalty.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";

contract ArtWhaleMarketplace is
    IArtWhaleMarketplace,
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC1155HolderUpgradeable,
    ERC721HolderUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using AddressUpgradeable for address payable;

    // settings
    uint256 internal _tradeFeePercent;
    EnumerableSetUpgradeable.AddressSet internal _settlementTokens;
    EnumerableSetUpgradeable.AddressSet internal _whitelistErc721;
    EnumerableSetUpgradeable.AddressSet internal _whitelistErc1155;

    // orders
    CountersUpgradeable.Counter internal _totalOrders;
    mapping(uint256 => Order) internal _orders;

    // state for getters
    mapping(OrderStatus => EnumerableSetUpgradeable.UintSet)
        internal _ordersByStatus;
    mapping(address => mapping(OrderStatus => EnumerableSetUpgradeable.UintSet))
        internal _ordersByUserByStatus;

    // order type
    mapping(uint256 => OrderType) internal _orderType;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address settlementToken,
        uint256 newTradeFeePercent
    ) external override initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        _settlementTokens.add(settlementToken);
        _setTradeFeePercent(newTradeFeePercent);
    }

    //
    // orders
    //

    function createOrder(
        NFTStandart nftStandart,
        address tokenContract,
        uint256 tokenId,
        uint256 tokenAmount,
        address settlementToken,
        uint256 price,
        OrderType orderType
    ) external override nonReentrant returns (uint256 orderId) {
        require(
            nftStandart != NFTStandart.NULL,
            "ArtWhaleMarketplace: wrong nft standart"
        );
        require(
            tokenContract != address(0),
            "ArtWhaleMarketplace: zero contract address"
        );
        if (nftStandart == NFTStandart.ERC721) {
            require(
                _whitelistErc721.contains(tokenContract),
                "ArtWhaleMarketplace: nft not registered"
            );
            require(tokenAmount == 1, "ArtWhaleMarketplace: wrong token amount");
        } else if (nftStandart == NFTStandart.ERC1155) {
            require(
                _whitelistErc1155.contains(tokenContract),
                "ArtWhaleMarketplace: nft not registered"
            );
            require(tokenAmount >= 1, "ArtWhaleMarketplace: wrong token amount");
        }
        require(
            settlementToken != address(0),
            "ArtWhaleMarketplace: zero trade token address"
        );
        require(
            _settlementTokens.contains(settlementToken),
            "ArtWhaleMarketplace: settlement token not registered"
        );
        require(price > 0, "ArtWhaleMarketplace: wrong price");

        // create order
        uint256 newOrderId = _totalOrders.current();
        _orders[newOrderId] = Order({
            orderId: newOrderId,
            nftStandart: nftStandart,
            tokenContract: tokenContract,
            tokenId: tokenId,
            tokenAmount: tokenAmount,
            settlementToken: settlementToken,
            price: price,
            status: OrderStatus.OPEN,
            seller: msg.sender,
            buyer: address(0)
        });
        _orderType[newOrderId] = orderType;
        _totalOrders.increment();

        // change state for getters
        _ordersByStatus[OrderStatus.OPEN].add(newOrderId);
        _ordersByUserByStatus[msg.sender][OrderStatus.OPEN].add(newOrderId);

        if (nftStandart == NFTStandart.ERC721) {
            IERC721Upgradeable(tokenContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId
            );
        } else if (nftStandart == NFTStandart.ERC1155) {
            IERC1155Upgradeable(tokenContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                tokenAmount,
                ""
            );
        }

        emit CreateOrder(
            msg.sender,
            newOrderId,
            nftStandart,
            tokenContract,
            tokenId,
            tokenAmount,
            settlementToken,
            price,
            orderType,
            block.timestamp
        );

        return (newOrderId);
    }

    function cancelOrder(
        uint256 orderId
    ) external override nonReentrant returns (bool success) {
        require(
            orderId < _totalOrders.current(),
            "ArtWhaleMarketplace: order does not exist"
        );

        Order memory order = _orders[orderId];

        require(
            order.status == OrderStatus.OPEN,
            "ArtWhaleMarketplace: only for open orders"
        );
        require(
            order.seller == msg.sender,
            "ArtWhaleMarketplace: sender is not the seller"
        );

        _orders[orderId].status = OrderStatus.CANCELLED;

        // change state for getters
        _ordersByStatus[OrderStatus.OPEN].remove(orderId);
        _ordersByUserByStatus[msg.sender][OrderStatus.OPEN].remove(orderId);
        _ordersByStatus[OrderStatus.CANCELLED].add(orderId);
        _ordersByUserByStatus[msg.sender][OrderStatus.CANCELLED].add(orderId);

        if (order.nftStandart == NFTStandart.ERC721) {
            IERC721Upgradeable(order.tokenContract).safeTransferFrom(
                address(this),
                msg.sender,
                order.tokenId
            );
        } else if (order.nftStandart == NFTStandart.ERC1155) {
            IERC1155Upgradeable(order.tokenContract).safeTransferFrom(
                address(this),
                msg.sender,
                order.tokenId,
                order.tokenAmount,
                ""
            );
        }

        emit CancelOrder(msg.sender, orderId, block.timestamp);

        return (true);
    }

    function executeOrder(
        uint256 orderId,
        address buyer
    ) external override nonReentrant returns (bool success) {
        require(
            orderId < _totalOrders.current(),
            "ArtWhaleMarketplace: order does not exist"
        );

        Order memory order = _orders[orderId];

        require(
            order.status == OrderStatus.OPEN,
            "ArtWhaleMarketplace: only for open orders"
        );
        require(order.seller != msg.sender, "ArtWhaleMarketplace: not for seller");

        if (_orderType[orderId] == OrderType.P2P) {
            require(buyer == address(0), "ArtWhaleMarketplace: need zero buyer");
            order.buyer = msg.sender;
        } else {
            require(msg.sender == owner(), "ArtWhaleMarketplace: only for owner");
            order.buyer = buyer;
        }
        order.buyer = msg.sender;
        order.status = OrderStatus.EXECUTED;
        _orders[orderId] = order;

        // get fund from the buyer
        IERC20Upgradeable(order.settlementToken).safeTransferFrom(
            order.buyer,
            address(this),
            order.price
        );

        // paying
        uint256 royaltyFee = 0;
        if (
            ERC165CheckerUpgradeable.supportsInterface(
                order.tokenContract,
                type(IRoyalty).interfaceId
            )
        ) {
            (
                address[] memory receiver,
                uint256[] memory amount,
                uint256 total
            ) = IRoyalty(order.tokenContract).calculateRoyalty(
                    order.tokenId,
                    order.price
                );

            for (uint256 i = 0; i < receiver.length; i++) {
                IERC20Upgradeable(order.settlementToken).safeTransfer(
                    receiver[i],
                    amount[i]
                );
            }

            royaltyFee = total;
        }
        uint256 tradeFee = order.price.mul(_tradeFeePercent).div(100);
        require(
            order.price > royaltyFee.add(tradeFee),
            "ArtWhaleMarketplace: incorrect fee/royalty calculation"
        );
        IERC20Upgradeable(order.settlementToken).safeTransfer(
            owner(),
            tradeFee
        );
        IERC20Upgradeable(order.settlementToken).safeTransfer(
            order.seller,
            order.price.sub(royaltyFee).sub(tradeFee)
        );

        // sends nft
        if (order.nftStandart == NFTStandart.ERC721) {
            IERC721Upgradeable(order.tokenContract).safeTransferFrom(
                address(this),
                order.buyer,
                order.tokenId
            );
        } else if (order.nftStandart == NFTStandart.ERC1155) {
            IERC1155Upgradeable(order.tokenContract).safeTransferFrom(
                address(this),
                order.buyer,
                order.tokenId,
                order.tokenAmount,
                ""
            );
        }

        // change state for getters
        _ordersByStatus[OrderStatus.OPEN].remove(orderId);
        _ordersByUserByStatus[order.seller][OrderStatus.OPEN].remove(orderId);
        _ordersByStatus[OrderStatus.EXECUTED].add(orderId);
        _ordersByUserByStatus[order.seller][OrderStatus.EXECUTED].add(orderId);

        emit ExecuteOrder(
            msg.sender,
            order.buyer,
            orderId,
            royaltyFee,
            tradeFee,
            block.timestamp
        );

        return (true);
    }

    function orderDetails(
        uint256 orderId
    ) external view override returns (Order memory) {
        return (_orders[orderId]);
    }

    function orderDetailsBatch(
        uint256[] memory orderIds
    ) external view override returns (Order[] memory) {
        Order[] memory result = new Order[](orderIds.length);
        for (uint256 i = 0; i < orderIds.length; i++) {
            result[i] = _orders[orderIds[i]];
        }
        return (result);
    }

    function orderType(uint256 orderId) external view returns (OrderType) {
        return (_orderType[orderId]);
    }

    function totalOrders(
        OrderStatus byStatus
    ) external view override returns (uint256) {
        if (byStatus == OrderStatus.ANY) {
            return (_totalOrders.current());
        }

        return (_ordersByStatus[byStatus].length());
    }

    function fetchOrdersBy(
        OrderStatus byStatus,
        uint256 cursor,
        uint256 howMany
    )
        external
        view
        override
        returns (uint256[] memory orderIds, uint256 newCursor)
    {
        return (
            _fetchWithPagination(_ordersByStatus[byStatus], cursor, howMany)
        );
    }

    function fetchOrdersBy(
        address byUser,
        OrderStatus byStatus,
        uint256 cursor,
        uint256 howMany
    )
        external
        view
        override
        returns (uint256[] memory orderIds, uint256 newCursor)
    {
        return (
            _fetchWithPagination(
                _ordersByUserByStatus[byUser][byStatus],
                cursor,
                howMany
            )
        );
    }

    //
    // trade fee
    //

    function setTradeFeePercent(
        uint256 newTradeFeePercent
    ) external override nonReentrant onlyOwner returns (bool success) {
        _setTradeFeePercent(newTradeFeePercent);
        return (true);
    }

    function tradeFeePercent() external view override returns (uint256) {
        return (_tradeFeePercent);
    }

    //
    // settlement tokens
    //

    function addSettlementToken(
        address erc20
    ) external override nonReentrant onlyOwner returns (bool success) {
        require(
            IERC20MetadataUpgradeable(erc20).decimals() == 18,
            "ArtWhaleMarketplace: wrong erc20 decimals"
        );
        _settlementTokens.add(erc20);
        return (true);
    }

    function removeSettlementToken(
        address erc20
    ) external override nonReentrant onlyOwner returns (bool success) {
        _settlementTokens.remove(erc20);
        return (true);
    }

    function containsSettlementToken(
        address erc20
    ) external view override returns (bool) {
        return (_settlementTokens.contains(erc20));
    }

    function getSettlementTokens()
        external
        view
        override
        returns (address[] memory)
    {
        return (_settlementTokens.values());
    }

    //
    // nft whitelist
    //

    function addToWhitelistErc721(
        address erc721
    ) external override nonReentrant onlyOwner returns (bool success) {
        _whitelistErc721.add(erc721);
        return (true);
    }

    function addToWhitelistErc1155(
        address erc1155
    ) external override nonReentrant onlyOwner returns (bool success) {
        _whitelistErc1155.add(erc1155);
        return (true);
    }

    function removeFromWhitelistErc721(
        address erc721
    ) external override nonReentrant onlyOwner returns (bool success) {
        _whitelistErc1155.remove(erc721);
        return (true);
    }

    function removeFromWhitelistErc1155(
        address erc1155
    ) external override nonReentrant onlyOwner returns (bool success) {
        _whitelistErc1155.remove(erc1155);
        return (true);
    }

    function containsWhitelistErc721(
        address erc721
    ) external view override returns (bool) {
        return (_whitelistErc721.contains(erc721));
    }

    function containsWhitelistErc1155(
        address erc1155
    ) external view override returns (bool) {
        return (_whitelistErc1155.contains(erc1155));
    }

    function getWhitelistErc721()
        external
        view
        override
        returns (address[] memory erc721)
    {
        return (_whitelistErc721.values());
    }

    function getWhitelistErc1155()
        external
        view
        override
        returns (address[] memory erc1155)
    {
        return (_whitelistErc1155.values());
    }

    //
    // other
    //

    function withdrawERC20(
        address erc20,
        uint256 amount
    ) external override nonReentrant onlyOwner returns (bool success) {
        if (erc20 != address(0)) {
            IERC20Upgradeable(erc20).safeTransfer(msg.sender, amount);
        } else {
            payable(msg.sender).sendValue(amount);
        }
        emit WithdrawERC20(msg.sender, erc20, amount, block.timestamp);
        return (true);
    }

    //
    // internal functions
    //

    function _setTradeFeePercent(uint256 newTradeFeePercent) internal {
        require(
            newTradeFeePercent >= 0 && newTradeFeePercent <= 100,
            "ArtWhaleMarketplace: wrong percent value"
        );
        _tradeFeePercent = newTradeFeePercent;
    }

    function _fetchWithPagination(
        EnumerableSetUpgradeable.UintSet storage set,
        uint256 cursor,
        uint256 howMany
    ) internal view returns (uint256[] memory values, uint256 newCursor) {
        uint256 length = howMany;
        if (length > set.length() - cursor) {
            length = set.length() - cursor;
        }

        values = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            values[i] = set.at(cursor + i);
        }

        return (values, cursor + length);
    }

    //
    // metadata
    //

    function name() external pure returns (string memory) {
        return "ArtWhale Marketplace";
    }
}
