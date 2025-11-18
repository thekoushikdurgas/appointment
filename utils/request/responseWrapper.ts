/**
 * Response Wrapper
 * 
 * Wrapper class to convert Axios responses to fetch Response-like interface
 */

import type { AxiosResponse } from 'axios';

/**
 * Response wrapper to match fetch Response interface
 * Implements a subset of Response interface that's actually used in the codebase
 */
export class AxiosResponseWrapper {
  private axiosResponse: AxiosResponse;
  private _bodyUsed: boolean = false;

  constructor(axiosResponse: AxiosResponse) {
    this.axiosResponse = axiosResponse;
  }

  get ok(): boolean {
    return this.axiosResponse.status >= 200 && this.axiosResponse.status < 300;
  }

  get status(): number {
    return this.axiosResponse.status;
  }

  get statusText(): string {
    return this.axiosResponse.statusText || '';
  }

  get headers(): Headers {
    const headers = new Headers();
    Object.entries(this.axiosResponse.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, String(v)));
      }
    });
    return headers;
  }

  get body(): ReadableStream<Uint8Array> | null {
    // Axios doesn't provide a ReadableStream, return null
    return null;
  }

  get bodyUsed(): boolean {
    return this._bodyUsed;
  }

  // Additional Response properties for compatibility
  get redirected(): boolean {
    return false;
  }

  get type(): ResponseType {
    return 'default';
  }

  get url(): string {
    return this.axiosResponse.config.url || '';
  }

  async bytes(): Promise<Uint8Array> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    const text = typeof this.axiosResponse.data === 'string'
      ? this.axiosResponse.data
      : JSON.stringify(this.axiosResponse.data);
    return new TextEncoder().encode(text);
  }

  async formData(): Promise<FormData> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    const formData = new FormData();
    if (typeof this.axiosResponse.data === 'object' && this.axiosResponse.data !== null) {
      Object.entries(this.axiosResponse.data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    return formData;
  }

  async json(): Promise<any> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    return this.axiosResponse.data;
  }

  async text(): Promise<string> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    
    // If data is already a string, return it
    if (typeof this.axiosResponse.data === 'string') {
      return this.axiosResponse.data;
    }
    
    // If data is a Blob, read it as text
    if (this.axiosResponse.data instanceof Blob) {
      return await this.axiosResponse.data.text();
    }
    
    // Otherwise, stringify JSON data
    return JSON.stringify(this.axiosResponse.data);
  }

  async blob(): Promise<Blob> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    
    // If data is already a Blob (from responseType: 'blob'), return it directly
    if (this.axiosResponse.data instanceof Blob) {
      return this.axiosResponse.data;
    }
    
    // If data is a string, create a blob from it
    if (typeof this.axiosResponse.data === 'string') {
      return new Blob([this.axiosResponse.data], { type: 'text/plain' });
    }
    
    // Otherwise, create a blob from JSON stringified data
    return new Blob([JSON.stringify(this.axiosResponse.data)], { type: 'application/json' });
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this._bodyUsed) {
      throw new Error('Body has already been read');
    }
    this._bodyUsed = true;
    const text = typeof this.axiosResponse.data === 'string'
      ? this.axiosResponse.data
      : JSON.stringify(this.axiosResponse.data);
    return new TextEncoder().encode(text).buffer;
  }

  clone(): AxiosResponseWrapper {
    // Create a new wrapper with the same data
    return new AxiosResponseWrapper(this.axiosResponse);
  }
}

