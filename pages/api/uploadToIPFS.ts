import { NextApiRequest, NextApiResponse } from 'next';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = new ThirdwebStorage({ secretKey: process.env.THIRDWEB_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    try {
      const imageData = fs.readFileSync(file.filepath);
      const upload = await storage.upload(imageData);
      const imageUrl = storage.resolveScheme(upload);
      
      res.status(200).json({ success: true, imageUrl });
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      res.status(500).json({ error: 'Failed to upload image to IPFS' });
    }
  });
}