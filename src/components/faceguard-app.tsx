
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, ShieldCheck, Share2, RefreshCw, Video, CheckCircle, ShieldAlert, Fingerprint, TrendingUp, Sparkles, Twitter, Facebook, Linkedin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";


type AppState = "idle" | "file-loaded" | "processing" | "success" | "error";
type ProtectionType = "image" | "video";

const IMAGE_MAX_SIZE_MB = 100;
const IMAGE_ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png'];
const VIDEO_MAX_SIZE_MB = 120;
const VIDEO_ACCEPTED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];

const processingStepsImage = [
  "Enhancing image quality...",
  "Applying imperceptible AI shield...",
  "Embedding invisible watermark...",
  "Signing cryptographic receipt...",
];

const processingStepsVideo = [
  "Analyzing video file...",
  "Calculating unique cryptographic hash...",
]

export function FaceGuardApp() {
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [protectionType, setProtectionType] = useState<ProtectionType>("image");
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [processedVideoUri, setProcessedVideoUri] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [protectionScore, setProtectionScore] = useState<number | null>(null);
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
    if (appState === 'processing') {
      const steps = protectionType === 'image' ? processingStepsImage : processingStepsVideo;
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1500); 
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
    setProtectionScore(null);
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

  const processFile = async (
    file: File,
    apiEndpoint: string,
    bodyKey: string
  ): Promise<{ processedUri: string; hash: string, protectionScore: number | null }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        try {
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [bodyKey]: dataUri }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to process ${protectionType}.`);
          }

          const data = await response.json();
          resolve({
            processedUri: data.processedImageUri || data.processedVideoUri,
            hash: data.hash,
            protectionScore: data.protectionScore || null,
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (error) => {
        reject(new Error("Failed to read file."));
      };
    });
  };

  const handleProcessImage = async () => {
    if (!file) return;

    setAppState("processing");
    setError(null);

    try {
      const { processedUri, hash, protectionScore } = await processFile(file, '/api/protect', 'imageDataUri');
      setProcessedImageUri(processedUri);
      setFileHash(hash);
      setProtectionScore(protectionScore);
      setAppState("success");
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
      const { processedUri, hash } = await processFile(file, '/api/protect-video', 'videoDataUri');
      setProcessedVideoUri(processedUri);
      setFileHash(hash)
      setAppState("success");
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

  const openShareDialog = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const url = "https://faceguard-woad.vercel.app"; // Replace with your actual URL
    const text = "I just protected my digital identity with FaceGuard! Their multi-layered defense shields images and videos from AI misuse. #Privacy #Security #FaceGuard";
    let shareUrl = "";

    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent("FaceGuard: Protect Your Digital Identity")}&summary=${encodeURIComponent(text)}`;
        break;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
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
                <Fingerprint className="mr-2"/>
                Register Video Fingerprint
              </Button>
            </div>
        </div>
      );
    }
    return null;
  };

  const renderProcessingState = () => {
    const steps = protectionType === 'image' ? processingStepsImage : processingStepsVideo;

    return (
      <div className="flex flex-col items-center gap-4 text-center p-8 w-full max-w-md">
        <div className="relative w-24 h-24">
          <ShieldCheck className="w-24 h-24 text-primary/30" />
          <ShieldCheck className="w-24 h-24 text-primary absolute top-0 left-0 animate-pulse-shield" />
        </div>
        <p className="text-lg font-medium mt-4">Building Your Fortress...</p>
        <div className="mt-4 w-full text-left">
            {steps.map((step, index) => (
                <div key={step} className={`flex items-center gap-3 transition-opacity duration-500 ${index <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="flex items-center justify-center w-6 h-6">
                        {index < currentStep ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                        ) : index === currentStep ? (
                           <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                        ) : (
                           <div className="w-5 h-5 flex items-center justify-center">
                             <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                           </div>
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
    const isImage = protectionType === 'image' && processedImageUri && fileHash;
    const isVideo = protectionType === 'video' && processedVideoUri && fileHash;

    if (!isImage && !isVideo) return null;

    return (
      <div className="flex flex-col items-center gap-6 text-center w-full">
        <ShieldCheck className="w-16 h-16 text-success animate-pulse-shield" style={{ animationIterationCount: 1, animationDuration: '1.5s' }} />
        <h2 className="text-2xl font-bold">{isImage ? 'Gold Standard Protection Applied!' : 'Your Video is Registered!'}</h2>
        
        <div className="flex flex-wrap justify-center gap-4">
          <a href={isImage ? processedImageUri : processedVideoUri} download={`protected_${fileName}.${isImage ? 'jpg' : 'mp4'}`}>
            <Button>
              <Download />
              Download {isImage ? 'Enhanced Image' : 'Original Video'}
            </Button>
          </a>
          <Button variant="outline" onClick={resetState}>
            <RefreshCw />
            Protect Another
          </Button>
        </div>

        {protectionScore && (
          <Card className="w-full bg-background/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" />
                Protection Score
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <Progress value={protectionScore} className="h-3" />
                <span className="font-bold text-lg text-primary">{protectionScore}</span>
              </div>
              <CardDescription className="text-xs mt-2">
                A measure of cryptographic and structural changes applied to your image.
              </CardDescription>
            </CardContent>
          </Card>
        )}

        <Card className="w-full bg-background/50 mt-2 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Proof of {isImage ? 'Protection' : 'Authenticity'}</CardTitle>
            <CardDescription>SHA-256 hash of your final protected file.</CardDescription>
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

        <div className="w-full text-center mt-4">
          <p className="text-sm font-medium mb-3">Share the mission!</p>
          <div className="flex justify-center gap-3">
             <Button variant="outline" size="icon" onClick={() => openShareDialog('twitter')}><Twitter className="h-4 w-4 text-[#1DA1F2]"/></Button>
             <Button variant="outline" size="icon" onClick={() => openShareDialog('facebook')}><Facebook className="h-4 w-4 text-[#1877F2]"/></Button>
             <Button variant="outline" size="icon" onClick={() => openShareDialog('linkedin')}><Linkedin className="h-4 w-4 text-[#0A66C2]"/></Button>
          </div>
        </div>
      </div>
    )
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
          <div className="p-6 flex-grow flex items-center justify-center m-0">
             {renderContent()}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
