import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface ConversionProgress {
  id: string;
  inputFile: string;
  outputFormat: string;
  progress: number;
  status: 'pending' | 'converting' | 'completed' | 'error';
  outputFile?: string;
}

export class AudioConverter {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private conversions = new Map<string, ConversionProgress>();
  private callbacks = new Set<(conversions: ConversionProgress[]) => void>();

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      this.ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw new Error('Audio converter initialization failed');
    }
  }

  async convertAudio(
    inputFile: File | Uint8Array,
    outputFormat: string,
    options: {
      quality?: string;
      bitrate?: string;
      sampleRate?: number;
    } = {}
  ): Promise<Uint8Array> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inputName = 'input.' + this.getFileExtension(inputFile);
    const outputName = `output.${outputFormat}`;

    const conversion: ConversionProgress = {
      id: conversionId,
      inputFile: inputName,
      outputFormat,
      progress: 0,
      status: 'pending'
    };

    this.conversions.set(conversionId, conversion);
    this.notifyCallbacks();

    try {
      conversion.status = 'converting';
      conversion.progress = 10;
      this.conversions.set(conversionId, conversion);
      this.notifyCallbacks();

      // Write input file
      const inputData = inputFile instanceof File ? await fetchFile(inputFile) : inputFile;
      await this.ffmpeg.writeFile(inputName, inputData);

      conversion.progress = 30;
      this.conversions.set(conversionId, conversion);
      this.notifyCallbacks();

      // Build FFmpeg command
      const command = this.buildConversionCommand(inputName, outputName, outputFormat, options);
      
      // Set up progress monitoring
      this.ffmpeg.on('progress', ({ progress }) => {
        conversion.progress = 30 + (progress * 0.6); // 30% to 90%
        this.conversions.set(conversionId, conversion);
        this.notifyCallbacks();
      });

      // Execute conversion
      await this.ffmpeg.exec(command);

      conversion.progress = 95;
      this.conversions.set(conversionId, conversion);
      this.notifyCallbacks();

      // Read output file
      const outputData = await this.ffmpeg.readFile(outputName);
      
      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      conversion.status = 'completed';
      conversion.progress = 100;
      conversion.outputFile = outputName;
      this.conversions.set(conversionId, conversion);
      this.notifyCallbacks();

      return outputData as Uint8Array;
    } catch (error) {
      conversion.status = 'error';
      this.conversions.set(conversionId, conversion);
      this.notifyCallbacks();
      throw error;
    }
  }

  private buildConversionCommand(
    inputName: string,
    outputName: string,
    outputFormat: string,
    options: {
      quality?: string;
      bitrate?: string;
      sampleRate?: number;
    }
  ): string[] {
    const command = ['-i', inputName];

    // Audio codec based on format
    switch (outputFormat.toLowerCase()) {
      case 'mp3':
        command.push('-c:a', 'libmp3lame');
        if (options.bitrate) {
          command.push('-b:a', options.bitrate);
        } else {
          command.push('-q:a', options.quality || '2'); // High quality
        }
        break;
      case 'm4a':
      case 'aac':
        command.push('-c:a', 'aac');
        command.push('-b:a', options.bitrate || '256k');
        break;
      case 'wav':
        command.push('-c:a', 'pcm_s16le');
        break;
      case 'flac':
        command.push('-c:a', 'flac');
        break;
      case 'ogg':
        command.push('-c:a', 'libvorbis');
        command.push('-q:a', options.quality || '5');
        break;
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    // Sample rate
    if (options.sampleRate) {
      command.push('-ar', options.sampleRate.toString());
    }

    // Remove video streams (audio only)
    command.push('-vn');
    
    // Output file
    command.push(outputName);

    return command;
  }

  private getFileExtension(file: File | Uint8Array): string {
    if (file instanceof File) {
      const parts = file.name.split('.');
      return parts[parts.length - 1] || 'unknown';
    }
    return 'bin'; // Default for Uint8Array
  }

  getConversions(): ConversionProgress[] {
    return Array.from(this.conversions.values());
  }

  getConversion(id: string): ConversionProgress | undefined {
    return this.conversions.get(id);
  }

  removeConversion(id: string): void {
    this.conversions.delete(id);
    this.notifyCallbacks();
  }

  onConversionsChange(callback: (conversions: ConversionProgress[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    const conversions = this.getConversions();
    this.callbacks.forEach(callback => callback(conversions));
  }

  // Preset conversion functions
  async convertToMp3(file: File | Uint8Array, quality: 'high' | 'medium' | 'low' = 'high'): Promise<Uint8Array> {
    const qualityMap = { high: '0', medium: '2', low: '4' };
    return this.convertAudio(file, 'mp3', { quality: qualityMap[quality] });
  }

  async convertToM4a(file: File | Uint8Array, bitrate = '256k'): Promise<Uint8Array> {
    return this.convertAudio(file, 'm4a', { bitrate });
  }

  async convertToWav(file: File | Uint8Array, sampleRate = 44100): Promise<Uint8Array> {
    return this.convertAudio(file, 'wav', { sampleRate });
  }

  async convertToFlac(file: File | Uint8Array): Promise<Uint8Array> {
    return this.convertAudio(file, 'flac');
  }
}

export const audioConverter = new AudioConverter();