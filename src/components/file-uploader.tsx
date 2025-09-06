"use client";

import { useState, useCallback, DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png'];

export function FileUploader({ onFileChange }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Invalid file type. Please upload a JPEG or PNG.",
      });
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: `File is larger than ${MAX_SIZE_MB}MB.`,
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileChange(file);
      } else {
        onFileChange(null);
      }
    }
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFileChange]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        "border-border/50 hover:border-primary hover:bg-primary/10",
        isDragging ? "border-primary bg-primary/10" : ""
      )}
      role="button"
      aria-label="File uploader"
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none">
        <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
        <p className="mb-2 text-lg font-semibold text-foreground">
          <span className="text-primary">Click to upload</span> or drag and drop your image
        </p>
        <p className="text-xs text-muted-foreground">
          PNG or JPG (Max {MAX_SIZE_MB}MB)
        </p>
      </div>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
}
