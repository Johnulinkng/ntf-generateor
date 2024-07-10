import type { NextApiRequest, NextApiResponse } from 'next'
import { mintNFT } from '@/utils/mintNFT'

const DEFAULT_IMAGE_URL = "/api/placeholder/500/500?text=AI+NFT";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { imageUrl } = req.body;
      const result = await mintNFT(imageUrl || DEFAULT_IMAGE_URL)
      if (result) {
        res.status(200).json({ 
          success: true, 
          rpcUrl: result.rpcUrl, 
          tokenId: result.tokenId,
          transactionHash: result.transactionHash
        })
      } else {
        res.status(500).json({ success: false, message: 'Failed to mint NFT' })
      }
    } catch (error) {
      console.error('Minting error:', error);
      res.status(500).json({ success: false, message: error || 'An error occurred while minting the NFT' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}