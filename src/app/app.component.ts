import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  public title = 'Angular web worker example';

  @ViewChild('imagePreview', { static: true })
  protected imagePreview?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput')
  protected fileInput!: ElementRef<HTMLInputElement>;

  private imagePreviewCtx: CanvasRenderingContext2D | null = null;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = false;

  public ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.imagePreviewCtx = this.imagePreview?.nativeElement.getContext('2d') || null;
    }
  }

  public triggerInput(): void {
    this.fileInput.nativeElement.click();
  }

  public onLoadImage(e: Event): void {
    const image = (e.target as HTMLInputElement).files![0];
    if (image) {
      console.log(`Image ${image.name} loaded`);
      createImageBitmap(image).then((bitmap) => {
        if (this.imagePreview) {
          this.imagePreview.nativeElement.width = bitmap.width;
          this.imagePreview.nativeElement.height = bitmap.height;
          this.imagePreviewCtx?.drawImage(bitmap, 0, 0);
        }
      });
    }
  }
  public applyEffect(effectType: string): void {
    if (this.imagePreview) {
      const { width, height } = this.imagePreview.nativeElement;
      const imageData = this.imagePreviewCtx?.getImageData(0, 0, width, height);
      if (imageData) {
        let processedImage: ImageData | null = null;
        if (effectType === 'gauss') {
          processedImage = applyGaussianBlur(imageData);
        }
        if (effectType === 'filter') {
          processedImage = applyImgFilter(imageData);
        }
        processedImage && this.imagePreviewCtx?.putImageData(processedImage, 0, 0);
      }
    }
  }

}



function applyGaussianBlur(imageData: ImageData, radius: number = 5): ImageData {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const kernel = getGaussianKernel(radius);

    // Clone the original pixels array to prevent modifying it directly
    const filteredPixels = new Uint8ClampedArray(pixels);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4;

            let r = 0, g = 0, b = 0, a = 0;
            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const offsetX = x + kx;
                    const offsetY = y + ky;

                    // Clamp to image boundaries
                    const clampedX = Math.min(Math.max(offsetX, 0), width - 1);
                    const clampedY = Math.min(Math.max(offsetY, 0), height - 1);

                    const kernelValue = kernel[ky + radius][kx + radius];
                    const neighborIndex = (clampedY * width + clampedX) * 4;

                    r += pixels[neighborIndex] * kernelValue;
                    g += pixels[neighborIndex + 1] * kernelValue;
                    b += pixels[neighborIndex + 2] * kernelValue;
                    a += pixels[neighborIndex + 3] * kernelValue;
                }
            }

            filteredPixels[pixelIndex] = r;
            filteredPixels[pixelIndex + 1] = g;
            filteredPixels[pixelIndex + 2] = b;
            filteredPixels[pixelIndex + 3] = a;
        }
    }

    return new ImageData(filteredPixels, width, height);
}

function getGaussianKernel(radius: number) {
    const kernelSize = radius * 2 + 1;
    const kernel = [];

    const sigma = radius / 3;
    const sigmaSquared = sigma * sigma;
    const twoSigmaSquared = 2 * sigmaSquared;
    let total = 0;

    for (let i = -radius; i <= radius; i++) {
        const row = [];
        for (let j = -radius; j <= radius; j++) {
            const distanceSquared = i * i + j * j;
            const value = Math.exp(-distanceSquared / twoSigmaSquared) / (Math.PI * twoSigmaSquared);
            row.push(value);
            total += value;
        }
        kernel.push(row);
    }

    // Normalize the kernel
    for (let i = 0; i < kernelSize; i++) {
        for (let j = 0; j < kernelSize; j++) {
            kernel[i][j] /= total;
        }
    }

    return kernel;
}

function applyImgFilter(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;

  // Apply color shift effect
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      // Shift the colors
      const newRed = (red + 100) % 256;
      const newGreen = (green + 50) % 256;
      const newBlue = (blue + 150) % 256;

      data[index] = newRed;
      data[index + 1] = newGreen;
      data[index + 2] = newBlue;
    }
  }

  // Apply blur effect
  const tempImageData = new Uint8ClampedArray(data);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]; // Gaussian blur kernel
  const kernelSize = 3;

  for (let y = kernelSize; y < height - kernelSize; y++) {
    for (let x = kernelSize; x < width - kernelSize; x++) {
      const index = (y * width + x) * 4;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kernelIndex = (ky + 1) * kernelSize + kx + 1;
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;

          rSum += tempImageData[pixelIndex] * kernel[kernelIndex];
          gSum += tempImageData[pixelIndex + 1] * kernel[kernelIndex];
          bSum += tempImageData[pixelIndex + 2] * kernel[kernelIndex];
        }
      }

      data[index] = rSum / 16;
      data[index + 1] = gSum / 16;
      data[index + 2] = bSum / 16;
    }
  }
  return imageData;
}
