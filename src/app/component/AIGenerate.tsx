import React, { useState } from 'react';
import { useActiveAccount } from "thirdweb/react";
import { TextField, Button, CircularProgress, Snackbar } from '@mui/material';

interface AIGenerateProps {
  onNFTGenerated: (nft: { id: string; name: string; image: string }) => void;
}

export const AIGenerate: React.FC<AIGenerateProps> = ({ onNFTGenerated }) => {
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [generateFailed, setGenerateFailed] = useState(false);
  
  const account = useActiveAccount();

  const handleGenerateAndMint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account) {
      setSnackbarMessage("Please connect your wallet first");
      setOpenSnackbar(true);
      return;
    }
    setIsGenerating(true);
    setGenerateFailed(false);
    try {
      // Generate image
      const generateRes = await fetch("../api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt }),
      });

      if (!generateRes.ok) {
        throw new Error("Failed to generate image");
      }

      const generateData = await generateRes.json();

      // Mint NFT
      await mintNFT(generateData.data[0].url);
    } catch (error) {
      console.error("Error:", error);
      setSnackbarMessage("Error: " + (error as Error).message);
      setOpenSnackbar(true);
      setGenerateFailed(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMintWithLocalImage = async () => {
    setIsMinting(true);
    try {
      await mintNFT('local');
    } catch (error) {
      console.error("Error minting with local image:", error);
      setSnackbarMessage("Error: " + (error as Error).message);
      setOpenSnackbar(true);
    } finally {
      setIsMinting(false);
    }
  };

  const mintNFT = async (imageUrl: string) => {
    try {
      const mintRes = await fetch("../api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nftImage: imageUrl,
          address: account!.address,
        }),
      });

      if (!mintRes.ok) {
        throw new Error("Failed to mint NFT");
      }

      const mintData = await mintRes.json();

      setSnackbarMessage("NFT minted successfully!");
      setOpenSnackbar(true);

      onNFTGenerated({
        id: mintData.tokenId,
        name: `AI NFT: ${imagePrompt}`,
        image: mintData.imageUrl,
      });
    } catch (error) {
      console.error("Minting error:", error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleGenerateAndMint}>
      <TextField
        fullWidth
        label="Enter image prompt"
        variant="outlined"
        value={imagePrompt}
        onChange={(e) => setImagePrompt(e.target.value)}
        disabled={isGenerating || isMinting}
        margin="normal"
        InputProps={{
          style: { color: 'white' }
        }}
        InputLabelProps={{
          style: { color: 'white' }
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!imagePrompt || isGenerating || isMinting}
      >
        {isGenerating ? 'Generating...' : 'Generate and Mint NFT'}
      </Button>
      {generateFailed && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleMintWithLocalImage}
          disabled={isMinting}
          style={{ marginLeft: '10px' }}
        >
          {isMinting ? 'Minting...' : 'Mint with Local Image'}
        </Button>
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </form>
  );
};