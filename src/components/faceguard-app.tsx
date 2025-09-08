"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, ShieldCheck, Share2, RefreshCw, Video, CheckCircle, ShieldAlert, Fingerprint } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppState = "idle" | "file-loaded" | "processing" | "success" | "error";
type ProtectionType = "image" | "video";

const IMAGE_MAX_SIZE_MB = 100;
const IMAGE_ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png'];
const VIDEO_MAX_SIZE_MB = 120;
const VIDEO_ACCEPTED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];

const processingSteps = [
  "Applying multi-layered AI shield...",
  "Embedding resilient watermark...",
  "Signing cryptographic receipt...",
  "Finalizing secure image...",
];

export function FaceGuardApp() {
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [protectionType, setProtectionType] = useState<ProtectionType>("image");
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [processedVideoUri, setProcessedVideoUri] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('protected_file');
  const [currentStep, setCurrentStep] = useState(0);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (appState === 'processing' && protectionType === 'image') {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < processingSteps.length - 1 ? prev + 1 : prev));
      }, 750); // Adjust timing as needed
    } else {
        setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [appState, protectionType]);


  const resetState = useCallback(() => {
    setFile(null);
    setAppState("idle");
    setProcessedImageUri(null);
    setProcessedVideoUri(null);
    setFileHash(null);
    setError(null);
    setCurrentStep(0);
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
      setFileName(selectedFile.name.split('.')[0]);
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
        setFileHash(data.hash);
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

  const handleProcessVideo = async () => {
    if (!file) return;

    setAppState("processing");
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const videoDataUri = reader.result as string;

        const response = await fetch('/api/protect-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoDataUri }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process video.');
        }

        const data = await response.json();
        setProcessedVideoUri(data.processedVideoUri);
        setFileHash(data.hash)
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
    if (fileHash) {
      navigator.clipboard.writeText(fileHash);
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
        descriptionText="MP4, MOV, MKV, or WEBM"
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
            <Button onClick={handleProcessImage} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ShieldAlert className="mr-2" />
              Protect Image
            </Button>
          </div>
        </div>
      );
    }
    if (protectionType === 'video' && filePreviewUrl) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
            <video src={filePreviewUrl} controls className="rounded-lg object-contain max-h-60 w-auto shadow-lg" />
            <p className="text-sm text-muted-foreground">{file?.name}</p>
             <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={resetState}>Clear</Button>
              <Button onClick={handleProcessVideo} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Fingerprint />
                Register Video Fingerprint
              </Button>
            </div>
        </div>
      );
    }
    return null;
  };

  const renderProcessingState = () => {
    if (protectionType === 'video') {
       return (
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="relative w-24 h-24">
            <Fingerprint className="w-24 h-24 text-primary/30" />
            <Fingerprint className="w-24 h-24 text-primary absolute top-0 left-0 animate-pulse-shield" />
          </div>
          <p className="text-lg font-medium mt-4">Registering your video...</p>
          <p className="text-sm text-muted-foreground">Calculating unique cryptographic hash.</p>
        </div>
       )
    }

    return (
      <div className="flex flex-col items-center gap-4 text-center p-8 w-full max-w-md">
        <div className="relative w-24 h-24">
          <ShieldCheck className="w-24 h-24 text-primary/30" />
          <ShieldCheck className="w-24 h-24 text-primary absolute top-0 left-0 animate-pulse-shield" />
        </div>
        <p className="text-lg font-medium mt-4">Building Your Fortress...</p>
        <div className="mt-4 w-full text-left">
            {processingSteps.map((step, index) => (
                <div key={step} className={`flex items-center gap-3 transition-opacity duration-500 ${index <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="flex items-center justify-center w-6 h-6">
                        {index < currentStep ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                    </div>
                    <span className={`text-sm ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</span>
                </div>
            ))}
        </div>
      </div>
    );
  }


  const renderSuccessState = () => {
    if (protectionType === 'image' && processedImageUri && fileHash) {
      return (
        <div className="flex flex-col items-center gap-6 text-center">
          <ShieldCheck className="w-16 h-16 text-success animate-pulse" />
          <h2 className="text-2xl font-bold">Your Image is Protected!</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={processedImageUri} download={`protected_${fileName}.jpg`}>
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
                <code className="font-code text-sm break-all flex-1 text-left">{fileHash}</code>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy hash">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    if (protectionType === 'video' && processedVideoUri && fileHash) {
      return (
        <div className="flex flex-col items-center gap-6 text-center">
          <ShieldCheck className="w-16 h-16 text-success animate-pulse" />
          <h2 className="text-2xl font-bold">Your Video is Registered!</h2>
          <div className="flex flex-wrap justify-center gap-4">
             <a href={processedVideoUri} download={`${fileName}.mp4`}>
                <Button>
                  <Download />
                  Download Original
                </Button>
              </a>
            <Button variant="outline" onClick={resetState}>
              <RefreshCw />
              Register Another
            </Button>
          </div>
           <Card className="w-full bg-background/50 mt-4 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Proof of Authenticity</CardTitle>
              <CardDescription>SHA-256 hash of your original video.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <code className="font-code text-sm break-all flex-1 text-left">{fileHash}</code>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy hash">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    return null;
  }

  const renderErrorState = () => (
    <div className="text-center text-destructive p-8">
      <p className="font-semibold">Processing Failed</p>
      <p className="text-sm">{error}</p>
      <Button variant="outline" onClick={resetState} className="mt-4">Try again</Button>
    </div>
  );

  const renderContent = () => {
    switch (appState) {
      case 'idle':
        return renderIdleState();
      case 'file-loaded':
        return renderFileLoadedState();
      case 'processing':
        return renderProcessingState();
      case 'success':
        return renderSuccessState();
      case 'error':
        return renderErrorState();
      default:
        return null;
    }
  }


  return (
    <Card className="w-full max-w-2xl mt-8 shadow-2xl bg-card/80 backdrop-blur-sm border-white/10 min-h-[400px]">
      <CardContent className="p-0 flex flex-col">
        <Tabs value={protectionType} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-b-none rounded-t-lg">
            <TabsTrigger value="image">Image Protection</TabsTrigger>
            <TabsTrigger value="video">Video Registration</TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="p-6 flex-grow flex items-center justify-center m-0">
             {renderContent()}
          </TabsContent>
          <TabsContent value="video" className="p-6 flex-grow flex items-center justify-center m-0">
             {renderContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
