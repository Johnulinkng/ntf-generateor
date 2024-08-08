import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BigNumber } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SECRET_KEY = process.env.SECRET_KEY!;
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS!;

export async function mintNFT(imageUrl: string): Promise<{ rpcUrl: string; tokenId: string; transactionHash: string } | null> {
  console.log('Minting NFT');

  if (!PRIVATE_KEY || !SECRET_KEY || !NFT_CONTRACT_ADDRESS) {
    console.error('Missing required environment variables');
    return null;
  }

  const sdk = ThirdwebSDK.fromPrivateKey(PRIVATE_KEY, "sepolia", {
    secretKey: SECRET_KEY,
  });
//hans cool
  try {
    const nftCollection = await sdk.getContract(NFT_CONTRACT_ADDRESS, "nft-collection");

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