import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Loader2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { webAudioService } from '@/services/webAudioService';
import { musicDB, Song } from '@/utils/musicDatabase';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFilesAdded: (count: number) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesAdded,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    
    let addedCount = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress((i / files.length) * 100);

        try {
          // Extract metadata
          const metadata = await webAudioService.extractMetadata(file);
          
          // Create object URL for playback
          const objectUrl = webAudioService.createObjectURL(file);
          
          // Create song entry
          const song: Song = {
            id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            duration: metadata.duration,
            filePath: objectUrl,
            size: file.size,
            dateAdded: new Date(),
            playCount: 0,
            genre: metadata.genre,
            year: metadata.year
          };

          // Save to database
          await musicDB.addSong(song);
          addedCount++;
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          toast.error(`Failed to add ${file.name}`);
        }
      }

      setProgress(100);
      
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} songs to your library`);
        onFilesAdded(addedCount);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process files');
    } finally {
      setIsUploading(false);
      setCurrentFile('');
      setProgress(0);
    }
  };

  const handleFileSelect = async () => {
    try {
      const files = await webAudioService.requestFileAccess();
      await handleFiles(files);
    } catch (error) {
      console.error('File selection error:', error);
      toast.error('Failed to select files');
    }
  };

  const handleDirectorySelect = async () => {
    try {
      const files = await webAudioService.requestDirectoryAccess();
      await handleFiles(files);
    } catch (error) {
      console.error('Directory selection error:', error);
      toast.error('Directory access not supported. Please select individual files.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(file.name)
    );

    if (files.length === 0) {
      toast.error('Please drop audio files only');
      return;
    }

    await handleFiles(files);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac,.wma"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFiles(files);
        }}
        className="hidden"
      />

      {/* Upload Progress */}
      {isUploading && (
        <div className="proton-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Processing Audio Files</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentFile}
              </p>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {/* Upload Options */}
      {!isUploading && (
        <div className="grid gap-4">
          {/* Drag & Drop Area */}
          <div
            className="proton-card p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Add Music Files</h3>
                <p className="text-sm text-muted-foreground">
                  Click to select files or drag and drop them here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports MP3, WAV, M4A, FLAC, OGG, AAC, WMA
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleFileSelect}
              className="proton-button h-12"
            >
              <FileAudio className="w-4 h-4 mr-2" />
              Select Files
            </Button>
            
            <Button
              onClick={handleDirectorySelect}
              variant="outline"
              className="h-12"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Select Folder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};