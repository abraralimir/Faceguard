"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, ShieldCheck, Share2, RefreshCw } from "lucide-react";

type AppState = "idle" | "file-loaded" | "processing" | "success" | "error";

export function FaceGuardApp() {
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('image.jpg');

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
    setProcessedImageUri(null);
    setImageHash(null);
    setError(null);
  }, []);

  const handleFileChange = (selectedFile: File | null) => {
    resetState();
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setAppState("file-loaded");
    } else {
      setAppState("idle");
    }
  };

  const handleProcessImage = async () => {
    if (!file) return;

    setAppState("processing");
    setError(null);

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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process image.');
        }

        const data = await response.json();
        setProcessedImageUri(data.processedImageUri);
        setImageHash(data.hash);
        setAppState("success");
      };
      reader.onerror = () => {
        throw new Error("Failed to read file.");
      }
    } catch (e: any) {
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

  const handleShare = async () => {
    if (!processedImageUri || !file) return;

    try {
      const response = await fetch(processedImageUri);
      const blob = await response.blob();
      
      const sharedFile = new File([blob], `protected_${fileName}`, { type: blob.type });
      
      const shareData = {
        files: [sharedFile],
        title: 'My Protected Image',
        text: 'This image was protected by FaceGuard.',
        url: 'https://faceguard-woad.vercel.app/'
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Image Shared!",
        });
      } else if (navigator.canShare && navigator.canShare({ files: [sharedFile] })) {
        // Fallback for browsers that can share files but not the full data object
        await navigator.share({
            files: [sharedFile],
            title: 'My Protected Image',
            text: `This image was protected by FaceGuard. Protect your digital identity: https://faceguard-woad.vercel.app/`
        });
      }
      else {
        toast({
          variant: "destructive",
          title: "Sharing Not Supported",
          description: "Your browser does not support sharing files directly. Please download the image to share it.",
        });
      }
    } catch (err) {
      console.error("Share failed:", err);
      // Avoid showing an error if the user cancels the share dialog
      if ((err as Error).name !== 'AbortError') {
        toast({
          variant: "destructive",
          title: "Share Failed",
          description: "Could not share the image.",
        });
      }
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
    <Card className="w-full max-w-2xl mt-8 shadow-2xl bg-card/80 backdrop-blur-sm border-white/10">
      <CardContent className="p-6 min-h-[350px] flex items-center justify-center">
        {appState === "idle" && <FileUploader onFileChange={handleFileChange} />}
        
        {appState === "file-loaded" && filePreviewUrl && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Image src={filePreviewUrl} alt="Image preview" width={400} height={300} className="rounded-lg object-contain max-h-60 w-auto shadow-lg" data-ai-hint="people photo"/>
            <p className="text-sm text-muted-foreground">{file?.name}</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={resetState}>Clear</Button>
              <Button onClick={handleProcessImage} className="bg-primary hover:bg-primary/90 text-primary-foreground">Protect Image</Button>
            </div>
          </div>
        )}

        {appState === "processing" && (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <div className="relative w-24 h-24">
              <ShieldCheck className="w-24 h-24 text-primary/30" />
              <ShieldCheck className="w-24 h-24 text-primary absolute top-0 left-0 animate-pulse-shield" />
            </div>
            <p className="text-lg font-medium mt-4">Protecting your identity...</p>
            <p className="text-sm text-muted-foreground">Applying shield, watermarking, and signing receipt.</p>
          </div>
        )}

        {appState === "success" && processedImageUri && imageHash && (
          <div className="flex flex-col items-center gap-6 text-center">
            <ShieldCheck className="w-16 h-16 text-success animate-pulse" />
            <h2 className="text-2xl font-bold">Your Image is Protected!</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={processedImageUri} download={`protected_${fileName}`}>
                <Button>
                  <Download />
                  Download
                </Button>
              </a>
              <Button onClick={handleShare} variant="secondary">
                <Share2 />
                Share
              </Button>
              <Button variant="outline" onClick={resetState}>
                <RefreshCw />
                Protect Another
              </Button>
            </div>
            
            <Card className="w-full bg-background/50 mt-4 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Proof of Protection</CardTitle>
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
