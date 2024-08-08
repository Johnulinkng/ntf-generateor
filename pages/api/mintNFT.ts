// File: pages/api/mintNFT.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BigNumber } from "ethers";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SECRET_KEY = process.env.SECRET_KEY!;
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS!;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXV7vmXShZ7fArHKhBVXfB8dDISXsB39I",
  authDomain: "openavatar2.firebaseapp.com",
  projectId: "openavatar2",
  storageBucket: "openavatar2.appspot.com",
  messagingSenderId: "915449456958",
  appId: "1:915449456958:web:c21909bcdf982bcee5246f",
  measurementId: "G-F2BRXS85XZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
//const analytics = getAnalytics(app);

async function uploadToFirebase(base64Image: string): Promise<string> {
  const storageRef = ref(storage, 'nft-images/' + Date.now() + '.jpg');
  
  // Upload the base64 string
  await uploadString(storageRef, base64Image, 'data_url');
  
  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  console.log("Firebase Storage URL:", downloadURL);
  
  return downloadURL;
}

async function mintNFT(imageUrl: string, walletAddress: string): Promise<{ rpcUrl: string; tokenId: string; transactionHash: string } | null> {
  console.log('Minting NFT');

  if (!PRIVATE_KEY || !SECRET_KEY || !NFT_CONTRACT_ADDRESS) {
    console.error('Missing required environment variables');
    return null;
  }

  const sdk = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, "sepolia", {
    secretKey: SECRET_KEY,
  });

  try {
    const nftCollection = await sdk.getContract(NFT_CONTRACT_ADDRESS, "nft-collection");//

    const mintResult = await nftCollection.mint({
      name: "AI Generated NFT",
      description: "An NFT generated with AI",
      image: imageUrl,
      properties: { 
        "NFT Type": "AI Generated",
        "Generation Method": "AI Generated"
      },
    });

    const provider = sdk.getProvider();
    const rpcUrl = (provider as any).connection?.url || "RPC URL not available";

    const tokenId = BigNumber.from(mintResult.id).toString();

    console.log({
      message: "NFT minted successfully",
      transactionHash: mintResult.receipt.transactionHash,
      tokenId: tokenId,
      rpcUrl: rpcUrl,
      imageUrl: imageUrl
    });

    return { 
      rpcUrl, 
      tokenId, 
      transactionHash: mintResult.receipt.transactionHash 
    };
  } catch (error) {
    console.error('Error in minting:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { imageBase64, walletAddress } = req.body;

      // 上传图像到 Firebase Storage
      const firebaseUrl = await uploadToFirebase(imageBase64);

      // 使用 Firebase URL 铸造 NFT
      const result = await mintNFT(firebaseUrl, walletAddress);
      
      if (result) {
        res.status(200).json({ 
          success: true, 
          rpcUrl: result.rpcUrl, 
          tokenId: result.tokenId,
          transactionHash: result.transactionHash,
          imageUrl: firebaseUrl
        })
      } else {
        res.status(500).json({ success: false, message: 'Failed to mint NFT' })
      }
    } catch (error) {
      console.error('Minting error:', error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'An error occurred while minting the NFT' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}