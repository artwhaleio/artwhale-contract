// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

interface IArtBlockMarket {

    enum OrderStatus {NULL, OPEN, CANCELLED, EXECUTED, ANY}
    enum OrderType {P2P, AUTHORITY}
    enum NFTStandart {NULL, ERC721, ERC1155}

    struct Order {
        uint256 orderId;
        NFTStandart nftStandart;
        address tokenContract;
        uint256 tokenId;
        uint256 tokenAmount;
        address settlementToken;
        uint256 price;
        OrderStatus status;
        address seller;
        address buyer;
    }

    event CreateOrder(
        address indexed user,
        uint256 otderId,
        NFTStandart nftStandart,
        address indexed tokenContract,
        uint256 indexed tokenId,
        uint256 tokenAmount,
        address settlementToken,
        uint256 price,
        OrderType orderType,
        uint256 timestamp
    );
    event CancelOrder(
        address indexed user,
        uint256 indexed orderId,
        uint256 timestamp
    );
    event ExecuteOrder(
        address indexed executor,
        address indexed buyer,
        uint256 indexed orderId,
        uint256 fee,
        uint256 timestamp
    );
    event WithdrawERC20(address indexed admin, address indexed tokenContract, uint256 amount, uint256 timestamp);
    event WithdrawERC721(address indexed admin, address indexed tokenContract, uint256 tokenId, uint256 timestamp);
    event WithdrawERC1155(address indexed admin, address indexed tokenContract, uint256 tokenId, uint256 tokenAmount, uint256 timestamp);

    function initialize(address settlementToken, uint256 tradeFee) external;

    // orders

    function createOrder(
        NFTStandart nftStandart,
        address tokenContract,
        uint256 tokenId,
        uint256 tokenAmount,
        address settlementToken,
        uint256 price,
        OrderType orderType
    ) external returns(uint256 orderId);

    function cancelOrder(uint256 orderId) external returns(bool success);

    function executeOrder(uint256 orderId, address buyer) external returns(bool success);

    function orderDetails(uint256 orderId) external view returns(Order memory);

    function orderDetailsBatch(uint256[] memory orderIds) external view returns(Order[] memory);

    function orderType(uint256 orderId) external view returns(OrderType);

    function totalOrders(OrderStatus byStatus) external view returns(uint256);

    function fetchOrdersBy(
        OrderStatus byStatus,
        uint256 cursor,
        uint256 howMany
    ) external view returns(uint256[] memory orderIds, uint256 newCursor);

    function fetchOrdersBy(
        address byUser,
        OrderStatus byStatus,
        uint256 cursor,
        uint256 howMany
    ) external view returns(uint256[] memory orderIds, uint256 newCursor);

    // trade fee

    function setTradeFeePercent(uint256 newTradeFeePercent) external returns(bool success);

    function tradeFeePercent() external view returns(uint256);

    // settlement tokens

    function addSettlementToken(address erc20) external returns(bool success);

    function removeSettlementToken(address erc20) external returns(bool success);

    function containsSettlementToken(address erc20) external view returns(bool);

    function getSettlementTokens() external view returns(address[] memory erc20);

    // nft whitelist

    function addToWhitelistErc721(address erc721) external returns(bool success);

    function addToWhitelistErc1155(address erc1155) external returns(bool success);

    function removeFromWhitelistErc721(address erc721) external returns(bool success);

    function removeFromWhitelistErc1155(address erc1155) external returns(bool success);

    function containsWhitelistErc721(address erc721) external view returns(bool);

    function containsWhitelistErc1155(address erc1155) external view returns(bool);

    function getWhitelistErc721() external view returns(address[] memory erc721);

    function getWhitelistErc1155() external view returns(address[] memory erc1155);

    // other

    function withdrawERC20(address erc20, uint256 amount) external returns(bool success);

}