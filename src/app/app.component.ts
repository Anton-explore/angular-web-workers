import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public title = 'Angular web worker example';

  public loadImage(e: Event): void {
    const image = (e.target as HTMLInputElement).files![0];
    console.log(`Image ${image.name} loaded`);
  }
}
