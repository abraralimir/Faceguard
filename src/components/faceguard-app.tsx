"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, ShieldCheck, Share2, RefreshCw, Video, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription as AlertDescription, AlertTitle } from "@/components/ui/alert";


type AppState = "idle" | "file-loaded" | "processing" | "success" | "error";
type ProtectionType = "image" | "video";

const IMAGE_MAX_SIZE_MB = 15;
const IMAGE_ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png'];
const VIDEO_MAX_SIZE_MB = 50;
const VIDEO_ACCEPTED_MIME_TYPES = ['video/mp4', 'video/quicktime'];

export function FaceGuardApp() {
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [protectionType, setProtectionType] = useState<ProtectionType>("image");
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('protected_file');

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
    if(filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl)
    }
  }, [filePreviewUrl]);
  
  const handleTabChange = (value: string) => {
    resetState();
    setProtectionType(value as ProtectionType);
  };

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
        text: 'This image was protected by FaceGuard. Protect your digital identity: https://faceguard-woad.vercel.app/',
        url: 'https://faceguard-woad.vercel.app/'
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Image Shared!",
        });
      } else if (navigator.canShare && navigator.canShare({ files: [sharedFile] })) {
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

  const renderIdleState = () => {
    if (protectionType === "image") {
      return (
        <FileUploader
          onFileChange={handleFileChange}
          acceptedMimeTypes={IMAGE_ACCEPTED_MIME_TYPES}
          maxSizeMb={IMAGE_MAX_SIZE_MB}
          descriptionText="PNG or JPG"
        />
      );
    }
    return (
      <FileUploader
        onFileChange={handleFileChange}
        acceptedMimeTypes={VIDEO_ACCEPTED_MIME_TYPES}
        maxSizeMb={VIDEO_MAX_SIZE_MB}
        descriptionText="MP4 or MOV"
      />
    );
  };
  
  const renderFileLoadedState = () => {
    if (protectionType === 'image' && filePreviewUrl) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Image src={filePreviewUrl} alt="Image preview" width={400} height={300} className="rounded-lg object-contain max-h-60 w-auto shadow-lg" data-ai-hint="people photo"/>
          <p className="text-sm text-muted-foreground">{file?.name}</p>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={resetState}>Clear</Button>
            <Button onClick={handleProcessImage} className="bg-primary hover:bg-primary/90 text-primary-foreground">Protect Image</Button>
          </div>
        </div>
      );
    }
    if (protectionType === 'video' && filePreviewUrl) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
            <video src={filePreviewUrl} controls className="rounded-lg object-contain max-h-60 w-auto shadow-lg" />
            <p className="text-sm text-muted-foreground">{file?.name}</p>
            <Alert variant="default" className="bg-primary/10 border-primary/20 text-foreground">
              <AlertCircle className="h-4 w-4 !text-primary" />
              <AlertTitle>Coming Soon!</AlertTitle>
              <AlertDescription>
                Full video protection is currently in development. We're working hard to bring this powerful feature to FaceGuard. Stay tuned!
              </AlertDescription>
            </Alert>
             <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={resetState}>Clear</Button>
            </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-2xl mt-8 shadow-2xl bg-card/80 backdrop-blur-sm border-white/10">
      <CardContent className="p-0">
        <Tabs value={protectionType} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-b-none rounded-t-lg">
            <TabsTrigger value="image">Image Protection</TabsTrigger>
            <TabsTrigger value="video">Video Protection</TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="p-6 min-h-[450px] flex items-center justify-center m-0">
             {appState === "idle" && renderIdleState()}
             {appState === "file-loaded" && renderFileLoadedState()}
             
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

          </TabsContent>
          <TabsContent value="video" className="p-6 min-h-[450px] flex items-center justify-center m-0">
             {appState === "idle" && renderIdleState()}
             {appState === "file-loaded" && renderFileLoadedState()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

    