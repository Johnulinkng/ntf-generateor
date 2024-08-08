// // pages/api/purchase-nft.ts

// import type { NextApiRequest, NextApiResponse } from 'next';
// import { ThirdwebSDK } from "@thirdweb-dev/sdk";
// import { ethers } from 'ethers';

// // const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
// // const ERC20_TOKEN_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
// // const PRIVATE_KEY = process.env.PRIVATE_KEY;
// // const SECRET_KEY = process.env.SECRET_KEY;
// const NFT_CONTRACT_ADDRESS="0x505905eca8d3Bdd97428Fe9b925507fe81c7d1e2"
// const ERC20_TOKEN_ADDRESS="0x1B998F4b9BFEE8Ee857785Ef7F4838Db1Ec33521"
// const PRIVATE_KEY="7e7d367f83083f586e9f7a6cd610b7eda75b4cb933521eaf684340406f43d14a"
// const SECRET_KEY="0c4AeVT3_JZIkuj_7WmMsRVDB0N0ID0Q7ZOQh53iYFqH8dyyWLW9sLMc21akLa62VkYCidUazjHNbEg6ngVBBQ"

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { tokenId, userAddress } = req.body;

//   if (!tokenId || !userAddress) {
//     return res.status(400).json({ message: 'Missing required parameters' });
//   }

//   try {
//     if (!PRIVATE_KEY || !SECRET_KEY || !NFT_CONTRACT_ADDRESS || !ERC20_TOKEN_ADDRESS) {
//       throw new Error('Missing environment variables');
//     }

//     const sdk = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, "sepolia", {
//       secretKey: SECRET_KEY,
//     });

//     const nftCollection = await sdk.getContract(NFT_CONTRACT_ADDRESS);
//     const erc20Contract = await sdk.getContract(ERC20_TOKEN_ADDRESS);

//     const signer = sdk.getSigner();
//     if (!signer) {
//       throw new Error('Failed to get signer');
//     }

//     // Purchase amount
//     const purchaseAmount = ethers.utils.parseUnits("0.01", 6); // 0.01 token

//     console.log("Approving ERC20 token...");
//     const approveTx = await erc20Contract.call("approve", [nftCollection, purchaseAmount]);
//     await approveTx.receipt;
//     console.log("ERC20 token approved");

//     console.log("Transferring NFT...");
//     const nftAbi = [  {
//         "type": "function",
//         "name": "safeTransferFrom",
//         "inputs": [
//           {
//             "type": "address",
//             "name": "from",
//             "internalType": "address"
//           },
//           {
//             "type": "address",
//             "name": "to",
//             "internalType": "address"
//           },
//           {
//             "type": "uint256",
//             "name": "tokenId",
//             "internalType": "uint256"
//           }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//       },
//       {
//         "type": "function",
//         "name": "safeTransferFrom",
//         "inputs": [
//           {
//             "type": "address",
//             "name": "from",
//             "internalType": "address"
//           },
//           {
//             "type": "address",
//             "name": "to",
//             "internalType": "address"
//           },
//           {
//             "type": "uint256",
//             "name": "tokenId",
//             "internalType": "uint256"
//           },
//           {
//             "type": "bytes",
//             "name": "data",
//             "internalType": "bytes"
//           }
//         ],
//         "outputs": [],
//         "stateMutability": "nonpayable"
//       }];
//     const nftInterface = new ethers.utils.Interface(nftAbi);
//     const data = nftInterface.encodeFunctionData("safeTransferFrom", [NFT_CONTRACT_ADDRESS, userAddress, tokenId]);

//     const tx = await signer.sendTransaction({
//       to: NFT_CONTRACT_ADDRESS,
//       data: data,
//     });

//     console.log("Waiting for transaction confirmation...");
//     const receipt = await tx.wait();
//     console.log("NFT transferred:", receipt.transactionHash);

//     if (receipt.status === 1) {
//       console.log("NFT transfer successful");
//       res.status(200).json({ success: true, message: 'NFT purchased successfully', transactionHash: receipt.transactionHash });
//     } else {
//       throw new Error("NFT transfer failed");
//     }

//   } catch (error) {
//     console.error('Error in NFT purchase process:', error);
//     res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'An unexpected error occurred' });
//   }
// }