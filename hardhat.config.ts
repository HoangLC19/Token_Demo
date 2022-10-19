import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
dotenv.config();
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            evmVersion: "berlin",
        },
    },
    networks: {
        goerli: {
            url: ALCHEMY_API_KEY_URL,
            accounts: [GOERLI_PRIVATE_KEY || ""],
            chainId: 5,
        },
    },

    gasReporter: {
        enabled: true,
        currency: "USD",
        token: "ETH",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        // outputFile: `/logs/gas-cost-${Date.now()}.log`,
        gasPriceApi:
            "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    },

    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },

    etherscan: {
        apiKey: {
            goerli: ETHERSCAN_API_KEY || "",
        },
    },
}

export default config;
