export const USDT_ADDRESSES = {
    BSC: '0x55d398326f99059fF775485246999027B3197955',
    TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
};

export const PLATFORM_WALLET_ADDRESS = {
    BSC: import.meta.env.VITE_PLATFORM_WALLET_ADDRESS_BSC,
    TRON: import.meta.env.VITE_PLATFORM_WALLET_ADDRESS_TRON,
};

export const SIGNUP_FEE_USDT = 20;

export const USDT_ABI = [
    // Minimal ABI for ERC20 transfer
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
];
