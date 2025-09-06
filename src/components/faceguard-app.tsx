"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, ShieldCheck } from "lucide-react";

type AppState = "idle" | "file-loaded" | "processing" | "success" | "error";

export function FaceGuardApp() {
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const filePreviewUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);
  
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const resetState = useCallback(() => {
    setFile(null);
    setAppState("idle");
    setProgress(0);
    setProcessedImageUri(null);
    setImageHash(null);
    setError(null);
  }, []);

  const handleFileChange = (selectedFile: File | null) => {
    resetState();
    if (selectedFile) {
      setFile(selectedFile);
      setAppState("file-loaded");
    } else {
      setAppState("idle");
    }
  };

  const handleProcessImage = async () => {
    if (!file) return;

    setAppState("processing");
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const imageDataUri = reader.result as string;

        const response = await fetch('/api/protect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUri }),
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process image.');
        }

        const data = await response.json();
        setProcessedImageUri(data.processedImageUri);
        setImageHash(data.hash);
        setProgress(100);
        setAppState("success");
      };
      reader.onerror = () => {
        throw new Error("Failed to read file.");
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      const errorMessage = e.message || "An unknown error occurred.";
      setError(errorMessage);
      setAppState("error");
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: errorMessage,
      });
    }
  };
  
  const copyToClipboard = () => {
    if (imageHash) {
      navigator.clipboard.writeText(imageHash);
      toast({
        title: "Copied to clipboard!",
        description: "The SHA-256 hash has been copied.",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mt-8 shadow-lg bg-card">
      <CardContent className="p-6">
        {appState === "idle" && <FileUploader onFileChange={handleFileChange} />}
        
        {appState === "file-loaded" && filePreviewUrl && (
          <div className="flex flex-col items-center gap-4">
            <Image src={filePreviewUrl} alt="Image preview" width={400} height={300} className="rounded-lg object-contain max-h-60 w-auto" data-ai-hint="people photo"/>
            <p className="text-sm text-muted-foreground">{file?.name}</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={resetState}>Clear</Button>
              <Button onClick={handleProcessImage}>Process Image</Button>
            </div>
          </div>
        )}

        {appState === "processing" && (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <p className="text-lg font-medium">Protecting your image...</p>
            <p className="text-sm text-muted-foreground">Applying AI-shielding, watermarking, and hashing. This may take a moment.</p>
            <Progress value={progress} className="w-full mt-2" />
          </div>
        )}

        {appState === "success" && processedImageUri && imageHash && (
          <div className="flex flex-col items-center gap-6 text-center">
            <ShieldCheck className="w-16 h-16 text-success" />
            <h2 className="text-2xl font-bold">Your Image is Protected!</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={processedImageUri} download={`protected_${file?.name || 'image'}`}>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </a>
              <Button variant="outline" onClick={resetState}>Protect Another</Button>
            </div>
            
            <Card className="w-full bg-background mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Proof of Originality</CardTitle>
                <CardDescription>SHA-256 hash of your protected image.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <code className="font-code text-sm break-all flex-1 text-left">{imageHash}</code>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy hash">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {appState === 'error' && (
          <div className="text-center text-destructive p-8">
            <p className="font-semibold">Processing Failed</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" onClick={resetState} className="mt-4">Try again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
