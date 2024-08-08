// import React, { useState } from 'react';
// import { ThirdwebSDK } from "@thirdweb-dev/sdk";
// import { ethers } from 'ethers';

// interface NFTPurchaseProps {
//   tokenId: string;
//   onPurchaseComplete: (tokenId: string) => void;
// }

// const NFT_CONTRACT_ADDRESS = "0x505905eca8d3Bdd97428Fe9b925507fe81c7d1e2";
// const ERC20_TOKEN_ADDRESS = "0x1B998F4b9BFEE8Ee857785Ef7F4838Db1Ec33521";
// const PRIVATE_KEY = "7e7d367f83083f586e9f7a6cd610b7eda75b4cb933521eaf684340406f43d14a";
// const SECRET_KEY = "0c4AeVT3_JZIkuj_7WmMsRVDB0N0ID0Q7ZOQh53iYFqH8dyyWLW9sLMc21akLa62VkYCidUazjHNbEg6ngVBBQ";

// export const NFTPurchase: React.FC<NFTPurchaseProps> = ({ tokenId, onPurchaseComplete }) => {
//   const [isPurchasing, setIsPurchasing] = useState(false);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);

//   const handlePurchaseNFT = async () => {
//     if (!tokenId) return;

//     setIsPurchasing(true);
//     setErrorMessage(null);

//     try {
//       if (!PRIVATE_KEY || !SECRET_KEY) {
//         throw new Error('Missing private key or secret key');
//       }

//       const sdk = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, "sepolia", {
//         secretKey: SECRET_KEY,
//       });

//       const nftCollection = await sdk.getContract(NFT_CONTRACT_ADDRESS);
//       const erc20Contract = await sdk.getContract(ERC20_TOKEN_ADDRESS);

//       const signer = sdk.getSigner();
//       if (!signer) {
//         throw new Error('Failed to get signer');
//       }

//       const userAddress = await signer.getAddress();

//       // 购买金额
//       const purchaseAmount = ethers.utils.parseUnits("0.01", 6); // 0.01 token

//       console.log("Approving ERC20 token...");
//       const approveTx = await erc20Contract.call("approve", [nftCollection, purchaseAmount]);
//       await approveTx.receipt;
//       console.log("ERC20 token approved");

//       console.log("Transferring NFT...");
//       const nftAbi = ["function safeTransferFrom(address from, address to, uint256 tokenId)"];
//       const nftInterface = new ethers.utils.Interface(nftAbi);
//       const data = nftInterface.encodeFunctionData("safeTransferFrom", [NFT_CONTRACT_ADDRESS, userAddress, tokenId]);

//       const tx = await signer.sendTransaction({
//         to: NFT_CONTRACT_ADDRESS,
//         data: data,
//       });

//       console.log("Waiting for transaction confirmation...");
//       const receipt = await tx.wait();
//       console.log("NFT transferred:", receipt.transactionHash);

//       if (receipt.status === 1) {
//         console.log("NFT transfer successful");
//         alert(`NFT with token ID ${tokenId} purchased successfully!`);
//         onPurchaseComplete(tokenId);
//       } else {
//         throw new Error("NFT transfer failed");
//       }

//     } catch (error) {
//       console.error('Error in NFT purchase process:', error);
//       let errorMsg = 'An unexpected error occurred during the NFT purchase.';
      
//       if (error instanceof Error) {
//         errorMsg = error.message;
//       }
      
//       setErrorMessage(errorMsg);
//       alert(`Error: ${errorMsg}`);
//     } finally {
//       setIsPurchasing(false);
//     }
//   };

//   return (
//     <div className="bg-white p-8 rounded-lg max-w-md w-full">
//       <h2 className="text-2xl font-bold mb-4">Purchase NFT</h2>
//       <p>Would you like to purchase this NFT (Token ID: {tokenId})?</p>
//       {errorMessage && (
//         <p className="text-red-500 mt-2">{errorMessage}</p>
//       )}
//       <div className="mt-6 flex justify-end space-x-4">
//         <button
//           onClick={() => onPurchaseComplete("")}
//           className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={handlePurchaseNFT}
//           disabled={isPurchasing}
//           className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
//         >
//           {isPurchasing ? 'Purchasing...' : 'Purchase NFT'}
//         </button>
//       </div>
//     </div>
//   );
// };