import React, { useState, useRef, useEffect } from 'react';
import { useActiveAccount } from "thirdweb/react";
import { Button, CircularProgress, Snackbar, Typography, Paper, Box, Step, StepLabel, Stepper } from '@mui/material';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { styled } from '@mui/system';
import { AlertCircle, Upload, Wand2 } from 'lucide-react';
import workflowDatam1 from '../../../pages/workflowman/doubleartman.json';
import workflowDatam2 from '../../../pages/workflowman/doubleman2 (1).json';
import workflowDatam3 from '../../../pages/workflowman/doubleman2.json';
import workflowDatam4 from '../../../pages/workflowman/doubleman3.json';
import workflowDatam5 from '../../../pages/workflowman/doublemanexcell.json';
import workflowDatam6 from '../../../pages/workflowman/doublemanwells.json';
import workflowDatam7 from '../../../pages/workflowman/doubleartman.json';
import workflowDatam8 from '../../../pages/workflowman/mandouble1.json';

import workflowDataw1 from '../../../pages/workflowfemale/cybermask anime.json';
import workflowDataw2 from '../../../pages/workflowfemale/watercolor woman.json';
import workflowDataw3 from '../../../pages/workflowfemale/blindboxwomanh.json';
import workflowDataw4 from '../../../pages/workflowfemale/cyberpunkwoman.json';
import workflowDataw5 from '../../../pages/workflowfemale/mangawoman (1).json';//
import workflowDataw6 from '../../../pages/workflowfemale/beachwoman2.5dfinal.json';
import workflowDataw7 from '../../../pages/workflowfemale/非写实风cyberpunkwomen.json';
import workflowDataw8 from '../../../pages/workflowfemale/yutianaddwatercolorlady.json';


//ui
const StyledPaper = styled(Paper)({
  padding: '24px',
  marginBottom: '24px',
  backgroundColor: '#f5f5f5',
});

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ selected }) => ({
  margin: '8px',
  backgroundColor: selected ? '#1976d2' : '#e0e0e0',
  color: selected ? '#ffffff' : '#000000',
  '&:hover': {
    backgroundColor: selected ? '#1565c0' : '#d5d5d5',
  },
  '&:disabled': {
    backgroundColor: '#f0f0f0',
    color: 'rgba(0, 0, 0, 0.26)',
  },
}));




interface AIGenerateProps {
  onImageGenerated: (images: Array<{ url: string; base64: string }>) => void;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;//新
}

interface HistoryOutput {
  images?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
}

interface HistoryData {
  [key: string]: {
    outputs: {
      [key: string]: HistoryOutput;
    };
  };
}

const server_address = "91b3-2601-14d-4d84-46e0-1989-604d-4db6-69f2.ngrok-free.app";//127.0.0.1:8188

export const AIGenerate: React.FC<AIGenerateProps> = ({ onImageGenerated, onFileSelect, disabled = false }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; base64: string }>>([]);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const account = useActiveAccount();

  useEffect(() => {
    const clientId = Math.random().toString(36).substring(7);
    wsRef.current = new WebSocket(`wss://${server_address}/ws?clientId=${clientId}`);

    wsRef.current.onopen = () => console.log("WebSocket connected");
    wsRef.current.onerror = (error) => console.error("WebSocket error:", error);
    wsRef.current.onclose = () => console.log("WebSocket disconnected");

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);  // 使用传入的 onFileSelect 函数
      console.log("File selected:", file.name);
    }
  };

  const compressImage = async (imageUrl: string, maxSizeInBytes: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let quality = 0.7;
        
        // set to 1024 像素
        const maxDimension = 1024;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
  
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
  
        const compressAndCheck = () => {
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          if (compressedBase64.length > maxSizeInBytes && quality > 0.1) {
            quality -= 0.1;
            compressAndCheck();
          } else {
            resolve(compressedBase64);
          }
        };
  
        compressAndCheck();
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    console.log("Uploading file:", file.name);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('overwrite', 'true');

    try {
      const response = await fetch(`https://${server_address}/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("File uploaded successfully:", data.name);
      return data.name;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const queuePrompt = async (prompt: any): Promise<{ prompt_id: string }> => {
    console.log("Queueing prompt:", prompt);
    try {
      const response = await fetch(`https://${server_address}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        throw new Error(`Queue prompt failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Prompt queued successfully:", data.prompt_id);
      return data;
    } catch (error) {
      console.error("Error queueing prompt:", error);
      throw error;
    }
  };

  const getImage = async (filename: string, subfolder: string, folder_type: string): Promise<ArrayBuffer> => {
    console.log("Getting image:", filename, subfolder, folder_type);
    const data = { filename, subfolder, type: folder_type };
    const url_values = new URLSearchParams(data).toString();
    try {
      const response = await fetch(`https://${server_address}/view?${url_values}`);
      if (!response.ok) {
        throw new Error(`Get image failed: ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error getting image:", error);
      throw error;
    }
  };//hansking cool

  const getHistory = async (prompt_id: string): Promise<HistoryData> => {
    try {
      const response = await fetch(`https://${server_address}/history/${prompt_id}`);
      if (!response.ok) {
        throw new Error(`Get history failed: ${response.statusText}`);
      }
      const text = await response.text();
      if (text.trim().startsWith('{')) {
        return JSON.parse(text);
      } else {
        console.error('Received non-JSON response:', text);
        throw new Error('Invalid JSON response');
      }
    } catch (error) {
      console.error("Error getting history:", error);
      throw error;
    }
  };

  const getImages = async (ws: WebSocket, prompt: any): Promise<ArrayBuffer | null> => {
    const promptResponse = await queuePrompt(prompt);
    const prompt_id = promptResponse.prompt_id;
    

    return new Promise((resolve, reject) => {
      //dp setting method
      let isProgressStarted = false;
      let isCompleted = false;
      const handleMessage = async (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        console.log("Received WebSocket message:", message);

        if (message.type === 'progress') {
          isProgressStarted = true;
        } else if (isProgressStarted && message.type === 'status') {
          isCompleted = true;

          console.log("Execution complete, fetching history...");

          try {
            const historyData = await getHistory(prompt_id);
            console.log("History data received:", historyData);
            
            if (historyData && historyData[prompt_id]) {
              const outputs = historyData[prompt_id].outputs;
              for (const output of Object.values(outputs)) {
                if (output.images && output.images.length > 0) {
                  const image = output.images[0];
                  console.log("Fetching image:", image.filename, image.subfolder, image.type);
                  const imageData = await getImage(image.filename, image.subfolder, image.type);
                  ws.removeEventListener('message', handleMessage);
                  resolve(imageData);
                  return;
                }
              }
            }
            console.log("No images found in history");
            ws.removeEventListener('message', handleMessage);
            resolve(null);
          } catch (error) {
            console.error("Error processing history:", error);
            ws.removeEventListener('message', handleMessage);
            reject(error);
          }
        }
      };

      ws.addEventListener('message', handleMessage);
    });
  };

  const generateImage = async (seed: number, iterationCount: number): Promise<{ url: string; base64: string } | null> => {
    if (!wsRef.current) {
      throw new Error("WebSocket not initialized");
    }
    let workflowData;
    if (selectedGender === 'female') {
      if (iterationCount === 0) {
        workflowData = workflowDataw1;
      } else if (iterationCount === 1) {
        workflowData = workflowDataw2;
      } else if (iterationCount === 2) {
        workflowData = workflowDataw3;
      } else if (iterationCount === 3) {
        workflowData = workflowDataw4;
      } else if (iterationCount === 4) {
        workflowData = workflowDataw5;
      } else if (iterationCount === 5) {
        workflowData = workflowDataw6;
      } else if (iterationCount === 6) {
        workflowData = workflowDataw7;
      } else if (iterationCount === 7) {
        workflowData = workflowDataw8;
      }
    } else {
      if (iterationCount === 0) {
        workflowData = workflowDatam1;
      } else if (iterationCount === 1) {
        workflowData = workflowDatam2;
      } else if (iterationCount === 2) {
        workflowData = workflowDatam3;
      } else if (iterationCount === 3) {
        workflowData = workflowDatam4;
      } else if (iterationCount === 4) {
        workflowData = workflowDatam5;
      } else if (iterationCount === 5) {
        workflowData = workflowDatam6;
      } else if (iterationCount === 6) {
        workflowData = workflowDatam7;
      } 
    }

    const workflow = JSON.parse(JSON.stringify(workflowData));
    workflow["1"]["inputs"]["image"] = await uploadFile(selectedFile!);
    if (selectedGender !== 'female' || (selectedGender === 'female' && iterationCount === 7)) {
      workflow["4"]["inputs"]["image"] = await uploadFile(selectedFile!);
    }
    workflow["11"]["inputs"]["seed"] = seed;


    const imageData = await getImages(wsRef.current, { prompt: workflow });

    if (imageData) {
      const blob = new Blob([imageData], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);
      const base64 = await compressImage(blobUrl, 1024 * 1024); // Compress to about 900KB
      //});
      return { url: blobUrl, base64 };
    }
  
    return null;
  };
  const handleGenerate = async () => {
    if (!account) {
      setSnackbarMessage("Please connect your wallet first");
      setOpenSnackbar(true);
      return;
    }
    if (!selectedGender || !selectedFile) {
      setSnackbarMessage('Please select both gender and image before generating.');
      setOpenSnackbar(true);
      return;
    }
    if (!selectedFile) {
      setSnackbarMessage("Please select an image first");
      setOpenSnackbar(true);
      return;
    }
    if (!selectedGender) {
      setSnackbarMessage("Please select a gender first");
      setOpenSnackbar(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    const newGeneratedImages: Array<{ url: string; base64: string }> = [];

    try {
      console.log("Starting image generation process");
////////////////////////times to run //////////////////////////////////////////////////////////////
      for (let i = 0; i < 2; i++) {
        const seed = Math.floor(Math.random() * 100000000);  // Generate a random seed
        

        const imageData = await generateImage(seed, i); 
        if (imageData) {  
          newGeneratedImages.push(imageData);
        }
      }

      setGeneratedImages(newGeneratedImages);
      onImageGenerated(newGeneratedImages);

      console.log("Images generated and displayed");
      setSnackbarMessage("Images generated and displayed");
    } catch (error) {
      console.error("Error in handleGenerate:", error);
      setSnackbarMessage("Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGenerating(false);
      setOpenSnackbar(true);
    }
  };

  const steps = ['Select Gender', 'Upload Image', 'Generate Images'];

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        Generate Your NFT Image
      </Typography>
      
      <Stepper activeStep={selectedGender ? (selectedFile ? 2 : 1) : 0} alternativeLabel sx={{ marginBottom: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <StyledPaper elevation={3}>
        <Typography variant="h6" gutterBottom>
          Step 1: Choose Gender
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <StyledButton
            selected={selectedGender === 'male'}
            onClick={() => setSelectedGender('male')}
            disabled={disabled || selectedGender === 'male'}
          >
            Male
          </StyledButton>
          <StyledButton
            selected={selectedGender === 'female'}
            onClick={() => setSelectedGender('female')}
            disabled={disabled || selectedGender === 'female'}
          >
            Female
          </StyledButton>
        </Box>
      </StyledPaper>

      <StyledPaper elevation={3}>
        <Typography variant="h6" gutterBottom>
          Step 2: Upload Image
        </Typography>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            startIcon={<Upload />}
          >
            Select Image
          </Button>
        </Box>
        {selectedFile && (
          <Typography variant="body2" align="center" sx={{ mt: 1, color: 'green' }}>
            File selected: {selectedFile.name}
          </Typography>
        )}
      </StyledPaper>

      <StyledPaper elevation={3}>
        <Typography variant="h6" gutterBottom>
          Step 3: Generate Images
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={disabled || isGenerating || !selectedFile || !selectedGender}
            startIcon={isGenerating ? <CircularProgress size={24} color="inherit" /> : <Wand2 />}
          >
            {isGenerating ? 'Generating...' : 'Generate Images'}
          </Button>
        </Box>
      </StyledPaper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};