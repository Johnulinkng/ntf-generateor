import { ethers, Contract, Signer, BigNumber } from 'ethers';

// fucking ABI hans 
type AbiType = Array<string | ethers.utils.FunctionFragment | ethers.utils.EventFragment>;
// 
const NFTPurchaseContractABI = [
    {
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_price",
				"type": "uint256"
			}
		],
		"name": "listNFT",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_usdcTokenAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_nftContractAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"name": "DebugLog",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "NFTListed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "NFTPurchased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			}
		],
		"name": "NFTUnlisted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			}
		],
		"name": "purchaseNFT",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			}
		],
		"name": "unlistNFT",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawUSDC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_tokenId",
				"type": "uint256"
			}
		],
		"name": "checkListing",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "listings",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "nftContract",
		"outputs": [
			{
				"internalType": "contract IERC721",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "usdcToken",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];


class NFTPurchaseWrapper {
    private contract: Contract;
  
    constructor(contractAddress: string, provider: ethers.providers.Provider) {
      this.contract = new ethers.Contract(contractAddress, NFTPurchaseContractABI, provider);
    }
  
    async listNFT(tokenId: number, price: BigNumber, signer: Signer): Promise<ethers.ContractReceipt> {
      const tx = await this.contract.connect(signer).listNFT(tokenId, price);
      return tx.wait();
    }
  
    async unlistNFT(tokenId: number, signer: Signer): Promise<ethers.ContractReceipt> {
      const tx = await this.contract.connect(signer).unlistNFT(tokenId);
      return tx.wait();
    }
  
    async purchaseNFT(tokenId: number, signer: Signer): Promise<ethers.ContractReceipt> {
      const tx = await this.contract.connect(signer).purchaseNFT(tokenId);
      return tx.wait();
    }
  
    async checkListing(tokenId: number): Promise<[number, BigNumber, boolean]> {
      return this.contract.checkListing(tokenId);
    }
  
    async withdrawUSDC(signer: Signer): Promise<ethers.ContractReceipt> {
      const tx = await this.contract.connect(signer).withdrawUSDC();
      return tx.wait();
    }
  }
  
  // 导出函数
  export const createNFTPurchaseWrapper = (contractAddress: string, provider: ethers.providers.Provider): NFTPurchaseWrapper => {
    return new NFTPurchaseWrapper(contractAddress, provider);
  };
  
  export const listNFT = async (wrapper: NFTPurchaseWrapper, tokenId: number, price: BigNumber, signer: Signer): Promise<ethers.ContractReceipt> => {
    return wrapper.listNFT(tokenId, price, signer);
  };
  
  export const unlistNFT = async (wrapper: NFTPurchaseWrapper, tokenId: number, signer: Signer): Promise<ethers.ContractReceipt> => {
    return wrapper.unlistNFT(tokenId, signer);
  };
  
  export const purchaseNFT = async (wrapper: NFTPurchaseWrapper, tokenId: number, signer: Signer): Promise<ethers.ContractReceipt> => {
    return wrapper.purchaseNFT(tokenId, signer);
  };
  
  export const checkListing = async (wrapper: NFTPurchaseWrapper, tokenId: number): Promise<[number, BigNumber, boolean]> => {
    return wrapper.checkListing(tokenId);
  };
  
  export const withdrawUSDC = async (wrapper: NFTPurchaseWrapper, signer: Signer): Promise<ethers.ContractReceipt> => {
    return wrapper.withdrawUSDC(signer);
  };