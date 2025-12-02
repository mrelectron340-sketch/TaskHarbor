// Helper functions for Storage operations
import { Storage } from '@massalabs/massa-as-sdk';
import { stringToBytes, bytesToString } from '@massalabs/as-types';

/**
 * Store bytes as hex string
 */
export function storeBytes(key: string, data: StaticArray<u8>): void {
  // Convert bytes to hex string
  let hex = '';
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const hexByte = byte.toString(16).padStart(2, '0');
    hex = hex + hexByte;
  }
  Storage.set(key, hex);
}

/**
 * Retrieve bytes from hex string
 */
export function getBytes(key: string): StaticArray<u8> {
  if (!Storage.has(key)) {
    return new StaticArray<u8>(0);
  }
  const hex = Storage.get(key);
  const bytes = new StaticArray<u8>(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const hexByte = hex.substr(i, 2);
    bytes[i / 2] = U8.parseInt(hexByte, 16);
  }
  return bytes;
}

/**
 * Store string value
 */
export function storeString(key: string, value: string): void {
  Storage.set(key, value);
}

/**
 * Get string value
 */
export function getString(key: string): string {
  if (!Storage.has(key)) {
    return '';
  }
  return Storage.get(key);
}






