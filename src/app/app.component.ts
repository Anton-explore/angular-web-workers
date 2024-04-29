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
  protected imagePreview!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput')
  protected fileInput!: ElementRef<HTMLInputElement>;

  private imagePreviewCtx!: CanvasRenderingContext2D | null;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = false;

  public ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.imagePreviewCtx = this.imagePreview.nativeElement.getContext('2d');
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
        this.imagePreview.nativeElement.width = bitmap.width;
        this.imagePreview.nativeElement.height = bitmap.height;
        this.imagePreviewCtx?.drawImage(bitmap, 0, 0);
      });
    }
  }
  public applyFilter(): void {
    console.log('Button clicked');
  }
}
