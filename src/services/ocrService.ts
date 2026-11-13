export class OcrService {
  private worker: any = null;
  private isInitializing: boolean = false;

  private async getWorker() {
    if (this.worker) return this.worker;
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return this.worker;
    }

    this.isInitializing = true;
    try {
      const { createWorker } = await import('tesseract.js');
      // Initialize with English, Hindi and Telugu language data
      let worker: any = null;
      try {
        worker = await createWorker('eng+hin+tel', 1, {
          logger: (m) => console.log('Tesseract OCR:', m.status, Math.round((m.progress || 0) * 100) + '%'),
        });
      } catch {
        try {
          worker = await createWorker('eng+hin', 1);
        } catch {
          worker = await createWorker('eng', 1);
        }
      }
      this.worker = worker;
      this.isInitializing = false;
      return this.worker;
    } catch (err) {
      console.warn('Failed to initialize Tesseract worker:', err);
      this.isInitializing = false;
      return null;
    }
  }

  /**
   * Recognizes text from a canvas or video element
   */
  public async readTextFromFrame(sourceElement: HTMLVideoElement | HTMLCanvasElement): Promise<string> {
    try {
      const worker = await this.getWorker();

      // Create high-contrast canvas for better OCR accuracy
      const canvas = document.createElement('canvas');
      const w = sourceElement instanceof HTMLVideoElement ? sourceElement.videoWidth || 640 : sourceElement.width;
      const h = sourceElement instanceof HTMLVideoElement ? sourceElement.videoHeight || 480 : sourceElement.height;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(sourceElement, 0, 0, w, h);

      const result = await worker.recognize(canvas);
      const text = result?.data?.text?.trim() || '';

      // Clean lines and punctuation
      const cleaned = text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 1)
        .join(', ');

      return cleaned;
    } catch (err) {
      console.error('OCR recognition error:', err);
      return '';
    }
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
      } catch {}
    }
  }
}

export const ocrService = new OcrService();
