import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export interface DeviceInfo {
  platform: string;
  model: string;
  osVersion: string;
  isVirtual: boolean;
  memUsed: number;
  diskFree: number;
  diskTotal: number;
  batteryLevel: number;
  isCharging: boolean;
}

export class DeviceInfoService {
  private deviceInfo: DeviceInfo | null = null;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await this.loadDeviceInfo();
    } catch (error) {
      console.error('Failed to initialize device info:', error);
    }
  }

  private async loadDeviceInfo(): Promise<void> {
    try {
      const info = await Device.getInfo();
      const batteryInfo = await Device.getBatteryInfo();
      
      this.deviceInfo = {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        isVirtual: info.isVirtual,
        memUsed: info.memUsed || 0,
        diskFree: 0, // Not available in Capacitor Device API
        diskTotal: 0, // Not available in Capacitor Device API
        batteryLevel: batteryInfo.batteryLevel || 0,
        isCharging: batteryInfo.isCharging || false
      };
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  isLowEndDevice(): boolean {
    if (!this.deviceInfo) return false;
    return this.deviceInfo.memUsed > 0.8; // Using 80%+ of memory
  }

  isLowStorage(): boolean {
    if (!this.deviceInfo) return false;
    const freeStorageRatio = this.deviceInfo.diskFree / this.deviceInfo.diskTotal;
    return freeStorageRatio < 0.1; // Less than 10% free
  }

  isLowBattery(): boolean {
    if (!this.deviceInfo) return false;
    return this.deviceInfo.batteryLevel < 0.2 && !this.deviceInfo.isCharging;
  }

  async refreshDeviceInfo(): Promise<void> {
    await this.loadDeviceInfo();
  }
}

export const deviceInfoService = new DeviceInfoService();