"use client"
import { useState, useEffect, useCallback } from 'react';
import { prepareContractCall, sendTransaction, readContract, PreparedTransaction} from "thirdweb";
import Image from "next/image";
import { ConnectButton, TransactionButton, useActiveAccount, useReadContract, MediaRenderer  } from "thirdweb/react";
import { client } from "./client";
import { defineChain, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { AIGenerate } from "./component/AIGenerate";
import { GetBalanceResult, getBalance } from "thirdweb/extensions/erc20";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";

const ERC20_TOKEN_ADDRESS = "0x1B998F4b9BFEE8Ee857785Ef7F4838Db1Ec33521";
const SPLIT_CONTRACT_ADDRESS = "0xf2ecC337247690C0b6d3Ec06B0b1fDca021f23aC"

interface WalletAddressProps {
  walletAddress: string;
}

export default function Home() {
  const account = useActiveAccount();
  const [generatedImages, setGeneratedImages] = useState<Array<{url: string, base64: string}>>([]);
  const [selectedImage, setSelectedImage] = useState<{url: string, base64: string} | null>(null);
  const [userNFTs, setUserNFTs] = useState<string[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [isNFTListed, setIsNFTListed] = useState(false)
  const [isApproving, setIsApproving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [ispreparingPurchase, setIsPreparingPurchase] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  //const [ownedNFTs, setOwnedNFTs] = useState<any[]>([]);

  
  const NFT_PURCHASE_CONTRACT_ADDRESS = "0xbE1DcDEE18CB2A818Bc75A2c56018A82D5bBd5BC";
  const NFT_CONTRACT_ADDRESS = "0x505905eca8d3Bdd97428Fe9b925507fe81c7d1e2";/////////////////////////////////////////////////////////////

//UI
  const fetchUSDCBalance = useCallback(async () => {
    if (account?.address) {
      const usdcContract = getContract({
        client: client,
        chain: sepolia,
        address: ERC20_TOKEN_ADDRESS
      });

      try {
        const balance = await getBalance({ contract: usdcContract, address: account.address });
        setUsdcBalance(ethers.utils.formatUnits(balance.value, balance.decimals));
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
      }
    }
  }, [account]);

//geting nft to be implement 
  const fetchUserNFTs = useCallback(async () => {
    if (account?.address) {

      //const nfts = await fetchNFTsForUser(account.address);
      //setUserNFTs(nfts);
    }
  }, [account]);

  useEffect(() => {
    fetchUSDCBalance();
    fetchUserNFTs();
  }, [fetchUSDCBalance, fetchUserNFTs]);

  const handleImageGenerated = (images: Array<{ url: string; base64: string }>) => {
    setGeneratedImages(images);
    setSelectedImage(null);
    setIsGenerating(false);
  };
//UI upper brow
  const nftContract = getContract({
    client,
    chain: defineChain(sepolia),
    address: NFT_CONTRACT_ADDRESS
  });
  const { data: ownedNFTs, isLoading: isLoadingNFTs } = useReadContract(
    getOwnedNFTs,
    {
      contract: nftContract,
      owner: account?.address || "",
    }
  );





  const handleImageSelect = (image: { url: string; base64: string }) => {
    setSelectedImage(image);
  };

  const handleMintNFT = async () => {
    if (!selectedImage || !account) return;
  
    setIsMinting(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/mintNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: selectedImage.base64,
          walletAddress: account.address
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        setMintedTokenId(result.tokenId);
        setShowPriceWarning(true);
        alert(`NFT minted successfully! Token ID: ${result.tokenId}`);
        
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred while minting');
    } finally {
      setIsMinting(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const preparePurchase = async () => {
    if (!account?.address || !mintedTokenId) {
      setErrorMessage("No account connected or no minted token");
      return;
    }
  
    setIsPreparing(true);  // set att before start!
    setErrorMessage(null);
  
    try {
      const response = await fetch('/api/buyNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approveNFT',
          tokenId: mintedTokenId,
          userAddress: account.address,
        }),
      });
  
      const approveResult = await response.json();
      if (!approveResult.success) throw new Error(approveResult.message);
  
      const listResponse = await fetch('/api/buyNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listNFT',
          tokenId: mintedTokenId,
          userAddress: account.address,
        }),
      });
      const listResult = await listResponse.json();
      if (listResult.success) {
        setIsNFTListed(true);
        setIsPrepared(true);
        alert('NFT approved and listed successfully');
      } else {
        throw new Error(listResult.message);
      }
    } catch (error) {
      console.error('Error preparing purchase:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred while preparing the purchase');
    } finally {
      setIsPreparing(false);  // reset at
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1">
    <div className="fixed inset-0 z-0">
      <Image 
        src="/wallhaven.png" 
        alt="Cyberpunk Background" 
        layout="fill"
        objectFit="cover"
        className="opacity-70"
      />
    </div>
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 opacity-50"></div>
    <main className="relative z-10 min-h-screen overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black bg-opacity-70 p-8 rounded-lg shadow-xl max-w-4xl w-full mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-8 digiternity-font">
            Digiternity Ai
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
              <h2 className="text-2xl font-bold mb-4">Here is a way to create your own nft ;)</h2>
              <AIGenerate onImageGenerated={handleImageGenerated} 
              onFileSelect={handleFileSelect}
              disabled={isGenerating || isMinting}
              />
              {previewImage && (
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2">Uploaded Image Preview</h3>
                  <Image 
                    src={previewImage} 
                    alt="Uploaded image preview" 
                    width={200} 
                    height={200} 
                    objectFit="cover"
                  />
                </div>
              )}
            </div>

            {generatedImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
                <p className="mb-4 text-yellow-300">Click on your favorite image to select it for minting!</p>
                <div className="grid grid-cols-3 gap-4">
                  {generatedImages.map((image, index) => (
                    <div 
                      key={index} 
                      className={`cursor-pointer ${selectedImage === image ? 'border-4 border-blue-500' : ''}`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <img src={image.url} alt={`Generated ${index + 1}`} className="w-full h-auto object-cover rounded" />
                    </div>
                  ))}
          </div>
          {selectedImage && !mintedTokenId && (
            <button
              onClick={handleMintNFT}
              disabled={isMinting}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
            >
              {isMinting ? 'Minting...' : 'Mint NFT'}
            </button>
          )}
          {mintedTokenId && (
  <div className="space-y-6 bg-gray-800 p-6 rounded-lg mt-6">
    <h3 className="text-xl font-bold text-center text-white mb-4">Purchase Your NFT</h3>
    
    <div>
      <p className="text-sm text-gray-300 mb-2">Step 1: Prepare your NFT for purchase</p>
      <button
        onClick={preparePurchase}
        disabled={isPreparing || isPrepared}
        className={`w-full py-2 px-4 rounded font-bold transition-all duration-300 ${
          isPrepared 
            ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isPreparing ? 'Preparing...' : (isPrepared ? 'Purchase Prepared' : 'Prepare Purchase')}
      </button>
    </div>

    <div>
      <p className="text-sm text-gray-300 mb-2">Step 2: Approve USDC for payment</p>
      <TransactionButton
        transaction={() => prepareContractCall({
          contract: getContract({
            client,
            chain: defineChain(sepolia),
            address: ERC20_TOKEN_ADDRESS
          }),
          method: "function approve(address spender, uint256 amount) returns (bool)",
          params: [NFT_PURCHASE_CONTRACT_ADDRESS, BigInt(1000000000000000001)]
        })}
        onTransactionConfirmed={() => {
          alert("USDC approved successfully");
          fetchUSDCBalance();
        }}
        onError={(error) => {
          console.error("approve failed:", error);
          setErrorMessage(`Failed to approve USDC: ${error.message}`);
        }}
        disabled={!isNFTListed}
        style={{
          width: '100%',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          backgroundColor: isNFTListed ? '#4CAF50' : '#cccccc',
          color: isNFTListed ? 'white' : '#666666',
          cursor: isNFTListed ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
        }}
      >
        Approve 1 USDC Payment
      </TransactionButton>
    </div>

    <div>
      <p className="text-sm text-gray-300 mb-2">Step 3: Complete your purchase</p>
      <TransactionButton
        transaction={() => prepareContractCall({
          contract: getContract({
            client,
            chain: defineChain(sepolia),
            address: NFT_PURCHASE_CONTRACT_ADDRESS,
            abi:[
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
              }
            ]
          }),
          method: "purchaseNFT",
          params: [BigInt(mintedTokenId)]
        })}
        onTransactionConfirmed={() => {
          alert("NFT purchased successfully");
          setIsNFTListed(false);
          fetchUSDCBalance();
          fetchUserNFTs();
        }}
        onError={(error) => {
          console.error("NFT purchase transaction failed:", error);
          setErrorMessage(`Failed to purchase NFT: ${error.message}`);
        }}
        disabled={!isNFTListed}
        style={{
          width: '100%',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          backgroundColor: isNFTListed ? '#2196F3' : '#cccccc',
          color: isNFTListed ? 'white' : '#666666',
          cursor: isNFTListed ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
        }}
      >
        Purchase NFT
      </TransactionButton>
    </div>
  </div>
)}

        {errorMessage && (
          <p className="text-red-500 mt-2">{errorMessage}</p>
        )}

      </div>)}
            {showPriceWarning && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 relative">
                <p>Warning: The price of this NFT may increase over time. Purchase now to secure the current price!</p>
                <button 
                  onClick={() => setShowPriceWarning(false)}
                  className="absolute top-2 right-2 text-yellow-700 hover:text-yellow-900"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-4">USDC Balance</h2>
                
                <p>{usdcBalance} USDC</p>
              </div>
              <div>
              <h2 className="text-2xl font-bold mb-4">Your NFTs</h2>
                  {isLoadingNFTs ? (
                    <p>Loading your NFTs...</p>
                  ) : ownedNFTs && ownedNFTs.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {ownedNFTs.map((nft: any, index: number) => (
                        <div key={index} className="relative">
                          <MediaRenderer
                            client={client}
                            src={`/api/tofirebase?url=${encodeURIComponent(nft.metadata.image)}`}
                            alt={`NFT ${nft.metadata.id}`}
                            width="100%"
                            height="auto"
                            className="rounded"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                            Token ID: {nft.metadata.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No NFTs found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="fixed right-4 top-4 z-20 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {showInfo ? 'Hide Info' : 'Show Info'}
        </button>

        {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}
   
      </main>
    </div>
  );
}

const USDCBalance: React.FC<WalletAddressProps> = ({ walletAddress }) => {
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (walletAddress) {
      const usdcContract = getContract({
        client: client,
        chain: sepolia,
        address: ERC20_TOKEN_ADDRESS
      });

      getBalance({ contract: usdcContract, address: walletAddress })
        .then((balance: GetBalanceResult) => {
          setBalance(ethers.utils.formatUnits(balance.value, balance.decimals));
        })
        .catch(error => console.error("Error fetching USDC balance:", error));
    }
  }, [walletAddress]);

  return (
    <div>
      <p>USDC Balance: {balance} USDC</p>
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


const InfoPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed right-0 top-0 h-full w-80 bg-black bg-opacity-90 p-6 overflow-y-auto z-30">
    <button 
      onClick={onClose}
      className="absolute top-2 right-2 text-white hover:text-gray-300"
    >
      ✕
    </button>
    <h2 className="text-2xl font-bold mb-4">How to Use</h2>
    <ol className="list-decimal list-inside space-y-2">
      <li>Connect your wallet using the button at the top.</li>
      <li>Click 'Generate' to create new AI-generated images.</li>
      <li>Select your favorite generated image by clicking on it.</li>
      <li>Click 'Mint NFT' to create your unique NFT.</li>
      <li>After minting, you can purchase the NFT. Be aware that the price may increase over time!</li>
    </ol>
    <h2 className="text-2xl font-bold mt-6 mb-4">About This Project</h2>
    <p>
      This project combines AI-generated art with blockchain technology. 
      Generate unique images with AI and mint them as NFTs. 
      Create one-of-a-kind digital art pieces that you truly own on the blockchain.
    </p>
  </div>
);