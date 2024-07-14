"use client"
import { useState } from 'react';
import Image from "next/image";
import { ConnectButton, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import thirdwebIcon from "@public/thirdweb.svg";
import { client } from "./client";
import { defineChain, getContract } from "thirdweb";
import { sepolia, baseSepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { claimTo as claimERC20, balanceOf as balanceOfERC20} from "thirdweb/extensions/erc20";
import { claimTo as claimERC721, balanceOf as balanceOfERC721 } from "thirdweb/extensions/erc721";
import { ethers } from 'ethers';
import { mintNFT } from "@/utils/mintNFT";
import { AIGenerate } from "./component/AIGenerate";



export default function Home() {
  const account = useActiveAccount();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]); 
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [userNFTs, setUserNFTs] = useState<string[]>([]);//

  const handleBuyNFT = async () => {
    if (!selectedImage || !account) return;

    setIsMinting(true);
    try {
      const response = await fetch('/api/buyNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: selectedImage,
          walletAddress: account.address
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`NFT purchased successfully! Transaction hash: ${result.transactionHash}`);
        // 更新用户的NFT列表
        setUserNFTs(prevNFTs => [...prevNFTs, selectedImage]);
      } else {
        alert('Failed to purchase NFT: ' + result.message);
      }
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      alert('An error occurred while purchasing the NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Image size exceeds 4MB limit. Please choose a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !prompt) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, init_image: uploadedImage })
      });
      
      const data = await response.json(); 
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      if (data.success && Array.isArray(data.output)) {
        setGeneratedImages(data.output);
      } else {
        throw new Error('Unexpected API response format');
      }
      setSelectedImage(null);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleMintNFT = async () => {
    if (!selectedImage) return;

    setIsMinting(true);
    try {
      const response = await fetch('/api/mintNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selectedImage }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`NFT minted successfully! Transaction hash: ${result.transactionHash}`);
      } else {
        alert('Failed to mint NFT: ' + result.message);
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('An error occurred while minting the NFT');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-2">
      {/* Left side - Background Image */}
      <div className="relative">
        <Image 
          src="/cyberpk.png" 
          alt="Cyberpunk Background" 
          layout="fill"
          objectFit="cover"
          className="opacity-70"
        />
      </div>

      {/* Right side - Gradient Background */}
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-green-900"></div>

      {/* Centered Content */}
      <div className="col-span-2 absolute inset-0 flex items-center justify-center">
        <div className="bg-black bg-opacity-70 p-8 rounded-lg shadow-xl max-w-4xl w-full">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-8 digiternity-font">
            Digiternity ai
          </h1>
          
          <div className="flex justify-center mb-8">
            <ConnectButton
              client={client}
              accountAbstraction={{
                chain: defineChain(sepolia),
                sponsorGas: true
              }}
              wallets={[inAppWallet()]}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Generate and Mint NFT</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="p-2 rounded bg-gray-700 text-white w-full"
              />
              {uploadedImage && (
                <img src={uploadedImage} alt="Uploaded" className="mt-4 w-64 h-64 object-cover" />
              )}
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt for AI generation"
                className="mt-4 p-2 rounded bg-gray-700 text-white w-full"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt || !uploadedImage}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {generatedImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
                <p className="mb-4 text-yellow-300">hey baby! Click on your favorite image to select it for minting!</p>
                <div className="grid grid-cols-3 gap-4">
                  {generatedImages.map((image, index) => (
                    <div 
                      key={index} 
                      className={`cursor-pointer ${selectedImage === image ? 'border-4 border-blue-500' : ''}`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <img src={image} alt={`Generated ${index + 1}`} className="w-full h-auto object-cover rounded" />
                    </div>
                  ))}
                </div>
                {selectedImage && (
                  <button
                    onClick={handleMintNFT}
                    disabled={isMinting}
                    className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
                  >
                    {isMinting ? 'Minting...' : 'Mint Selected NFT'}
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-4">USDC Balance</h2>
                <USDCBalance walletAddress={account?.address || ""} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Wallet Balances</h2>
                <UserNFTs nfts={userNFTs} />
              </div>
            </div>
            {selectedImage && (
          <button
            onClick={handleBuyNFT}
            disabled={isMinting}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
          >
            {isMinting ? 'Purchasing...' : 'Purchase NFT with USDC'}
          </button>
        )}
          </div>
        </div>
      </div>

      {/* Info Button */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="fixed right-4 top-4 z-20 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        {showInfo ? 'Hide Info' : 'Show Info'}
      </button>

      {/* Info Panel */}
      {showInfo && (
        <div className="fixed right-0 top-0 h-full w-80 bg-black bg-opacity-90 p-6 overflow-y-auto z-30">
          <h2 className="text-2xl font-bold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Connect your wallet using the button at the top.</li>
            <li>Upload an image you want to use as a base (max 4MB).</li>
            <li>Enter a prompt describing how you want to modify the image.</li>
            <li>Click 'Generate' to create new images based on your input.</li>
            <li>Select your favorite generated image by clicking on it.</li>
            <li>Click 'Mint Selected NFT' to create your unique NFT.</li>
            <li>Don't forget to claim your tokens and NFTs below!</li>
          </ol>
          <h2 className="text-2xl font-bold mt-6 mb-4">About This Project</h2>
          <p>
            This project combines AI-generated art with blockchain technology. 
            Upload your images, transform them with AI, and mint the results as unique NFTs. 
            Create one of a kind digital art pieces that you truly use on the blockchain.
          </p>
        </div>
      )}
    </main>
  );
}

const USDCBalance: React.FC<WalletAddressProps> = ({ walletAddress }) => {
  const usdcContract = getContract({
    client: client,
    chain: sepolia,
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // 替换为实际的USDC合约地址
  });

  const { data: usdcBalance } = useReadContract(
    balanceOfERC20,
    {
      contract: usdcContract,
      address: walletAddress || ""
    }
  );

  const formattedBalance = usdcBalance ? ethers.utils.formatUnits(usdcBalance.toString(), 6) : "0";

  return (
    <div>
      <p>USDC Balance: {formattedBalance} USDC</p>
    </div>
  );
};

const UserNFTs: React.FC<{ nfts: string[] }> = ({ nfts }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {nfts.map((nft, index) => (
        <img key={index} src={nft} alt={`NFT ${index + 1}`} className="w-full h-auto object-cover rounded" />
      ))}
    </div>
  );
};

function Header() {
  return (
    <header className="flex flex-col items-center mb-12">
      <Image
        src={thirdwebIcon}
        alt=""
        className="w-32 h-32 mb-4"
        style={{
          filter: "drop-shadow(0px 0px 24px #a726a9a8)",
        }}
      />
      <h1 className="text-4xl md:text-6xl font-bold text-center">
        Digiternity ai
        <span className="text-blue-400 inline-block mx-2">+</span>
        <span className="inline-block -skew-x-6 text-blue-500">Next.js</span>
      </h1>
    </header>
  );
}

type WalletAddressProps = {
  walletAddress?: string;
};

const ClaimButtons: React.FC<WalletAddressProps> = ({ walletAddress }) => {
  const sepoliaContract = getContract({
    client: client,
    chain: defineChain(sepolia),
    address: "0x54dc347F236686C42Cb0B296dB7cd14493FdFC55"
  });
  const modeContract = getContract({
    client: client,
    chain: defineChain(sepolia),
    address: "0x1B998F4b9BFEE8Ee857785Ef7F4838Db1Ec33521"
  });

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <TransactionButton
        transaction={() => claimERC721({
          contract: sepoliaContract,
          to: walletAddress || "",
          quantity: 1n
        })}
        onTransactionConfirmed={async () => {
          alert("Claimed Sepolia NFT");
        }}
      >
        Claim Sepolia NFT
      </TransactionButton>
      <TransactionButton
        transaction={() => claimERC20({
          contract: modeContract,
          to: walletAddress || "",
          quantity: "10"
        })}
        onTransactionConfirmed={async () => {
          alert("Claimed Mode Token");
        }}
      >
        Claim Mode Token
      </TransactionButton>
    </div>
  );
};

const WalletBalances: React.FC<WalletAddressProps> = ({ walletAddress }) => {
  const { data: sepoliaNFTBalance } = useReadContract(
    balanceOfERC721,
    {
      contract: getContract({
        client: client,
        chain: defineChain(sepolia),
        address: "0x54dc347F236686C42Cb0B296dB7cd14493FdFC55"
      }),
      owner: walletAddress || ""
    }
  );

  const { data: modeTokenBalance } = useReadContract(
    balanceOfERC20,
    {
      contract: getContract({
        client: client,
        chain: defineChain(sepolia),
        address: "0x1B998F4b9BFEE8Ee857785Ef7F4838Db1Ec33521"
      }),
      address: walletAddress || ""
    }
  );
    
  return (
    <div>
      <p>Wallet Balances</p>
      <p>Wallet Address: {walletAddress ? walletAddress : "No wallet is connected"}</p>
      <p>Sepolia NFT: {walletAddress ? sepoliaNFTBalance?.toString() : "0"}</p>
      <p>Mode Token: {walletAddress ? modeTokenBalance?.toString() : "0"}</p>
    </div>
  );
};