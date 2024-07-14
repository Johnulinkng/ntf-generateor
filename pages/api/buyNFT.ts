// pages/api/buyNFT.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

const THIRDWEB_SECRET_KEY = process.env.SECRET_KEY;
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS1 = process.env.NFT_CONTRACT_ADDRESS1;
const NFT_PRICE_IN_USDC = ethers.utils.parseUnits("0.01", 6); // 1 USDC (6 decimal places)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { imageUrl, walletAddress } = req.body;

  if (!imageUrl || !walletAddress) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    // 初始化 ThirdwebSDK
    const sdk = ThirdwebSDK.fromPrivateKey(THIRDWEB_SECRET_KEY!, "sepolia");

    // 获取 USDC 合约
    const usdcContract = await sdk.getContract(USDC_CONTRACT_ADDRESS!);

    // 获取 NFT 合约
    const nftContract = await sdk.getContract(NFT_CONTRACT_ADDRESS1!);

    // 检查用户的 USDC 余额
    const balance = await usdcContract.erc20.balanceOf(walletAddress);
    if (ethers.BigNumber.from(balance.value).lt(NFT_PRICE_IN_USDC)) {
      return res.status(400).json({ success: false, message: 'Insufficient USDC balance' });
    }

    // 转移 USDC
    const transferResult = await usdcContract.erc20.transfer(NFT_CONTRACT_ADDRESS1!, NFT_PRICE_IN_USDC.toString());
    if (!transferResult) {
      throw new Error('USDC transfer failed');
    }

    // 铸造 NFT
    const mintResult = await nftContract.erc721.mintTo(walletAddress, {
      name: "AI Generated NFT",
      description: "An NFT generated using AI",
      image: imageUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'NFT purchased successfully',
      transactionHash: mintResult.receipt.transactionHash,
    });

  } catch (error) {
    console.error('Error purchasing NFT:', error);
    return res.status(500).json({ success: false, message: 'Failed to purchase NFT', error: (error as Error).message });
  }
}