const USDT_ABI = [
    // The Transfer event is crucial for verifying payments
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    // We might need this to check decimals, though it's usually standard
    "function decimals() view returns (uint8)"
];

const USDT_ADDRESSES = {
    BSC: '0x55d398326f99059fF775485246999027B3197955',
    TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
};

const PLATFORM_WALLET_ADDRESS = {
    BSC: process.env.PLATFORM_WALLET_ADDRESS_BSC,
    TRON: process.env.PLATFORM_WALLET_ADDRESS_TRON,
};

const SIGNUP_FEE_USDT = 20;

module.exports = {
    USDT_ABI,
    USDT_ADDRESSES,
    PLATFORM_WALLET_ADDRESS,
    SIGNUP_FEE_USDT,
};
