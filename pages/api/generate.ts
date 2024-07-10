import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import FormData from 'form-data';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, init_image } = req.body;

  if (!prompt || !init_image) {
    return res.status(400).json({ error: "Missing prompt or initial image" });
  }

  try {
    // Check image size
    const imageBuffer = Buffer.from(init_image.split(',')[1], 'base64');
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: "Image size exceeds 4MB limit. Please use a smaller image." });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('mode', 'image-to-image');
    formData.append('output_format', 'jpeg');
    formData.append('strength', '0.7');
    formData.append('model', 'sd3-large');
    formData.append('samples', '1');
    formData.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      formData,
      {
        headers: { 
          ...formData.getHeaders(),
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json"
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    if (response.status === 200) {
      const data = response.data;
      if (data && data.image) {
        const base64Image = data.image;
        res.status(200).json({ success: true, output: [`data:image/jpeg;base64,${base64Image}`] });
      } else {
        throw new Error('Unexpected API response format');
      }
    } else {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Image generation error:', error);
    let errorMessage = 'Failed to generate image';
    if (error instanceof Error) {
      errorMessage += ': ' + error.message.slice(0, 100); // Limit error message length
    }
    res.status(500).json({ success: false, error: errorMessage });
  }
}