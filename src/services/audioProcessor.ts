import { AudioFormat, EqualizerPreset, AudioEffectSettings } from './enhancedDatabase';

/**
 * Advanced Web Audio API processor for high-quality audio playback
 */
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private equalizerNodes: BiquadFilterNode[] = [];
  private compressorNode: DynamicsCompressorNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private pannerNode: PannerNode | null = null;
  private playbackRateNode: AudioBufferSourceNode | null = null;
  
  // Pitch shifting variables
  private pitchShift: number = 0; // Semitones
  private playbackSpeed: number = 1.0;
  private pitchLocked: boolean = true;

  // Analysis data
  private frequencyData: Uint8Array = new Uint8Array();
  private timeData: Uint8Array = new Uint8Array();

  constructor() {
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context with fallbacks
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Resume context if suspended (Chrome policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.setupAudioGraph();
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Web Audio API not supported');
    }
  }

  /**
   * Setup complete audio processing graph
   */
  private setupAudioGraph(): void {
    if (!this.audioContext) return;

    // Create main nodes
    this.gainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.convolverNode = this.audioContext.createConvolver();
    this.pannerNode = this.audioContext.createPanner();

    // Setup analyser
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount);

    // Setup 10-band equalizer
    this.setupEqualizer();

    // Setup compressor defaults
    this.compressorNode.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressorNode.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);

    // Setup panner for spatial audio
    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = 1;
    this.pannerNode.maxDistance = 10000;
    this.pannerNode.rolloffFactor = 1;
    this.pannerNode.coneInnerAngle = 360;
    this.pannerNode.coneOuterAngle = 0;
    this.pannerNode.coneOuterGain = 0;
  }

  /**
   * Setup 10-band equalizer with standard frequencies
   */
  private setupEqualizer(): void {
    if (!this.audioContext) return;

    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.equalizerNodes = [];

    frequencies.forEach((freq, index) => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' : 
                    index === frequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      filter.Q.setValueAtTime(1, this.audioContext!.currentTime);
      filter.gain.setValueAtTime(0, this.audioContext!.currentTime);
      
      this.equalizerNodes.push(filter);
    });
  }

  /**
   * Connect audio processing chain
   */
  private connectAudioGraph(sourceNode: AudioBufferSourceNode): void {
    if (!this.audioContext || !this.gainNode || !this.analyserNode) return;

    // Connect in order: source -> EQ -> compressor -> convolver -> panner -> gain -> analyser -> destination
    let currentNode: AudioNode = sourceNode;

    // EQ chain
    this.equalizerNodes.forEach(filter => {
      currentNode.connect(filter);
      currentNode = filter;
    });

    // Effects chain
    currentNode.connect(this.compressorNode!);
    this.compressorNode!.connect(this.convolverNode!);
    this.convolverNode!.connect(this.pannerNode!);
    this.pannerNode!.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  /**
   * Load and decode audio file with format detection
   */
  async loadAudioFile(file: File): Promise<{
    buffer: AudioBuffer;
    format: AudioFormat;
    metadata: AudioMetadata;
  }> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    const format = this.detectAudioFormat(file.name, file.type);
    
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const metadata = this.extractAudioMetadata(audioBuffer, format);
      
      return { buffer: audioBuffer, format, metadata };
    } catch (error) {
      console.error('Failed to decode audio:', error);
      throw new Error(`Unsupported audio format: ${format}`);
    }
  }

  /**
   * Detect audio format from file properties
   */
  private detectAudioFormat(fileName: string, mimeType: string): AudioFormat {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Check MIME type first for better accuracy
    if (mimeType) {
      if (mimeType.includes('flac')) return AudioFormat.FLAC;
      if (mimeType.includes('wav')) return AudioFormat.WAV;
      if (mimeType.includes('aac') || mimeType.includes('mp4')) return AudioFormat.AAC;
      if (mimeType.includes('ogg')) return AudioFormat.OGG;
      if (mimeType.includes('opus')) return AudioFormat.OPUS;
    }

    // Fallback to extension
    switch (extension) {
      case 'mp3': return AudioFormat.MP3;
      case 'flac': return AudioFormat.FLAC;
      case 'wav': return AudioFormat.WAV;
      case 'aac': case 'm4a': return AudioFormat.AAC;
      case 'ogg': return AudioFormat.OGG;
      case 'alac': return AudioFormat.ALAC;
      case 'dsd': case 'dsf': return AudioFormat.DSD;
      case 'mqa': return AudioFormat.MQA;
      case 'opus': return AudioFormat.OPUS;
      case 'wma': return AudioFormat.WMA;
      default: return AudioFormat.MP3;
    }
  }

  /**
   * Extract audio metadata from buffer
   */
  private extractAudioMetadata(buffer: AudioBuffer, format: AudioFormat): AudioMetadata {
    return {
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      duration: buffer.duration,
      bitDepth: format === AudioFormat.FLAC ? 24 : 16, // Estimate
      format: format,
      isHighRes: buffer.sampleRate > 44100 || (format === AudioFormat.FLAC)
    };
  }

  /**
   * Play audio buffer with advanced controls
   */
  async playBuffer(buffer: AudioBuffer, startTime: number = 0): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    // Stop current playback
    this.stop();

    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.playbackRate.value = this.pitchLocked ? 
      this.playbackSpeed : this.playbackSpeed * this.semitoneToRatio(this.pitchShift);

    // Apply pitch shift if not locked to speed
    if (!this.pitchLocked && this.pitchShift !== 0) {
      // For real pitch shifting, we'd need a more complex implementation
      // This is a simplified version using playbackRate
      const pitchRatio = this.semitoneToRatio(this.pitchShift);
      this.sourceNode.playbackRate.value = pitchRatio;
    }

    // Connect audio graph
    this.connectAudioGraph(this.sourceNode);

    // Start playback
    this.sourceNode.start(0, startTime);
    this.playbackRateNode = this.sourceNode;
  }

  /**
   * Convert semitones to frequency ratio
   */
  private semitoneToRatio(semitones: number): number {
    return Math.pow(2, semitones / 12);
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Already stopped
      }
      this.sourceNode = null;
    }
  }

  /**
   * Set playback speed (0.5x - 2x)
   */
  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.5, Math.min(2.0, speed));
    if (this.sourceNode) {
      const finalRate = this.pitchLocked ? 
        this.playbackSpeed : this.playbackSpeed * this.semitoneToRatio(this.pitchShift);
      this.sourceNode.playbackRate.setValueAtTime(finalRate, this.audioContext!.currentTime);
    }
  }

  /**
   * Set pitch shift in semitones (-12 to +12)
   */
  setPitchShift(semitones: number): void {
    this.pitchShift = Math.max(-12, Math.min(12, semitones));
    if (this.sourceNode && !this.pitchLocked) {
      const pitchRatio = this.semitoneToRatio(this.pitchShift);
      this.sourceNode.playbackRate.setValueAtTime(
        this.playbackSpeed * pitchRatio, 
        this.audioContext!.currentTime
      );
    }
  }

  /**
   * Toggle pitch lock (keep pitch constant when changing speed)
   */
  setPitchLocked(locked: boolean): void {
    this.pitchLocked = locked;
    if (this.sourceNode) {
      const finalRate = locked ? this.playbackSpeed : 
        this.playbackSpeed * this.semitoneToRatio(this.pitchShift);
      this.sourceNode.playbackRate.setValueAtTime(finalRate, this.audioContext!.currentTime);
    }
  }

  /**
   * Apply equalizer preset
   */
  applyEqualizerPreset(preset: EqualizerPreset): void {
    if (!this.audioContext || this.equalizerNodes.length !== preset.bands.length) return;

    preset.bands.forEach((gain, index) => {
      const filter = this.equalizerNodes[index];
      filter.gain.setValueAtTime(gain, this.audioContext!.currentTime);
    });
  }

  /**
   * Set individual EQ band gain
   */
  setEqualizerBand(bandIndex: number, gain: number): void {
    if (!this.audioContext || bandIndex >= this.equalizerNodes.length) return;
    
    const clampedGain = Math.max(-12, Math.min(12, gain));
    this.equalizerNodes[bandIndex].gain.setValueAtTime(
      clampedGain, 
      this.audioContext.currentTime
    );
  }

  /**
   * Apply audio effects
   */
  applyEffects(effects: AudioEffectSettings): void {
    if (!this.audioContext || !this.compressorNode || !this.pannerNode) return;

    // Apply compressor settings
    if (effects.compressor.enabled) {
      this.compressorNode.threshold.setValueAtTime(
        effects.compressor.threshold, this.audioContext.currentTime
      );
      this.compressorNode.knee.setValueAtTime(
        effects.compressor.knee, this.audioContext.currentTime
      );
      this.compressorNode.ratio.setValueAtTime(
        effects.compressor.ratio, this.audioContext.currentTime
      );
    }

    // Apply spatial audio settings
    if (effects.spatialAudio.enabled) {
      this.pannerNode.rolloffFactor = effects.spatialAudio.rolloffFactor;
    }
  }

  /**
   * Set master volume with smooth transition
   */
  setVolume(volume: number, fadeTime: number = 0.1): void {
    if (!this.audioContext || !this.gainNode) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.setTargetAtTime(
      clampedVolume, 
      this.audioContext.currentTime, 
      fadeTime
    );
  }

  /**
   * Fade volume for sleep timer
   */
  fadeVolume(targetVolume: number, duration: number): void {
    if (!this.audioContext || !this.gainNode) return;
    
    this.gainNode.gain.exponentialRampToValueAtTime(
      Math.max(0.001, targetVolume), // Avoid zero for exponential ramp
      this.audioContext.currentTime + duration
    );
  }

  /**
   * Get current audio analysis data
   */
  getAnalysisData(): AudioAnalysisData {
    if (!this.analyserNode) {
      return { frequencyData: new Uint8Array(), timeData: new Uint8Array() };
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData);
    this.analyserNode.getByteTimeDomainData(this.timeData);

    return {
      frequencyData: this.frequencyData,
      timeData: this.timeData
    };
  }

  /**
   * Check browser audio capabilities
   */
  static checkAudioCapabilities(): AudioCapabilities {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return {
      webAudioAPI: !!window.AudioContext || !!(window as any).webkitAudioContext,
      maxChannels: context.destination.maxChannelCount,
      sampleRate: context.sampleRate,
      analyserNode: 'createAnalyser' in context,
      convolverNode: 'createConvolver' in context,
      dynamicsCompressor: 'createDynamicsCompressor' in context,
      scriptProcessor: 'createScriptProcessor' in context,
      audioWorklet: 'audioWorklet' in context,
      offlineAudioContext: !!window.OfflineAudioContext,
      mediaRecorder: !!window.MediaRecorder
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.audioContext = null;
    this.equalizerNodes = [];
  }
}

/**
 * Audio metadata interface
 */
export interface AudioMetadata {
  sampleRate: number;
  channels: number;
  duration: number;
  bitDepth: number;
  format: AudioFormat;
  isHighRes: boolean;
}

/**
 * Audio analysis data interface
 */
export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
}

/**
 * Browser audio capabilities
 */
export interface AudioCapabilities {
  webAudioAPI: boolean;
  maxChannels: number;
  sampleRate: number;
  analyserNode: boolean;
  convolverNode: boolean;
  dynamicsCompressor: boolean;
  scriptProcessor: boolean;
  audioWorklet: boolean;
  offlineAudioContext: boolean;
  mediaRecorder: boolean;
}

// Global audio processor instance
export const audioProcessor = new AudioProcessor();