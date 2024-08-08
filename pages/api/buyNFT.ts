import type { NextApiRequest, NextApiResponse } from 'next';
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from 'ethers';
import { NFT_PURCHASE_CONTRACT_ABI } from './contract';

const NFT_PURCHASE_CONTRACT_ADDRESS = "0xbE1DcDEE18CB2A818Bc75A2c56018A82D5bBd5BC";
const NFT_CONTRACT_ADDRESS = "0x505905eca8d3Bdd97428Fe9b925507fe81c7d1e2";
const ERC20_TOKEN_ADDRESS = "0x1B998F4b9BFEE8Ee857785Ef7F4838Db1Ec33521";
const PRIVATE_KEY = "7e7d367f83083f586e9f7a6cd610b7eda75b4cb933521eaf684340406f43d14a";
const SECRET_KEY = "0c4AeVT3_JZIkuj_7WmMsRVDB0N0ID0Q7ZOQh53iYFqH8dyyWLW9sLMc21akLa62VkYCidUazjHNbEg6ngVBBQ";
const Owner = "0xA9D5245AB88234C57DF9D0FB8e6CdE17e3d7291F";
//有可能会有问题
const FIXED_PRICE = ethers.utils.parseUnits("1", 18);


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, tokenId, userAddress } = req.body;

  if (!action || !tokenId || !userAddress) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const sdk = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, "sepolia", {
      secretKey: SECRET_KEY,
    });
    const nftPurchaseContract = await sdk.getContract(NFT_PURCHASE_CONTRACT_ADDRESS, NFT_PURCHASE_CONTRACT_ABI);
    const nftContract = await sdk.getContract(NFT_CONTRACT_ADDRESS);
    const usdcContract = await sdk.getContract(ERC20_TOKEN_ADDRESS);

    switch (action) {
      case 'approveNFT':
        // NFT approve for single tokenId
        const result = await nftContract.call("approve", [NFT_PURCHASE_CONTRACT_ADDRESS, tokenId]);
        console.log("NFT approved:", result.receipt.transactionHash);
        res.status(200).json({
          success: true,
          message: 'NFT approved successfully',
          transactionHash: result.receipt.transactionHash
        });
        break;

      case 'listNFT':
        // List NFT
        const listNFT = await nftPurchaseContract.call("listNFT", [tokenId, FIXED_PRICE]);
        console.log("NFT listed:", listNFT.receipt.transactionHash);
        res.status(200).json({
          success: true,
          message: 'NFT listed successfully',
          transactionHash: listNFT.receipt.transactionHash
        });
        break;

        default:
          res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      console.error('Error in NFT process:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
  }