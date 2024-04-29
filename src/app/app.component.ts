import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('imagePreview', { static: true })
  protected imagePreview?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput')
  protected fileInput!: ElementRef<HTMLInputElement>;
  private worker!: Worker;
  private imagePreviewCtx: CanvasRenderingContext2D | null = null;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = false;
  public title = 'Angular web worker example';

  public ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.imagePreviewCtx = this.imagePreview?.nativeElement.getContext('2d') || null;
      this.worker = new Worker(new URL('./workers/image-filter.worker', import.meta.url));
      this.worker.onmessage = ({ data: processedImage }) => {
        processedImage && this.imagePreviewCtx?.putImageData(processedImage, 0, 0);
      };
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
        this.worker.postMessage({ imageData, effectType }, [imageData.data.buffer]);
      }
    }
  }

  public ngOnDestroy(): void {
    if (this.isBrowser && this.worker) {
      this.worker.terminate();
    }
  }
}
