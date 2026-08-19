import { Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toJpeg, toPng } from 'html-to-image';

@Component({
  selector: 'app-export-controls',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './export-controls.html',
  styleUrl: './export-controls.scss',
})
export class ExportControls {
  readonly target = input.required<HTMLElement | null>();
  readonly filename = input('mosaic-template');
  readonly busy = signal(false);

  async download(format: 'png' | 'jpg'): Promise<void> {
    const element = this.target();
    if (!element || this.busy()) return;
    this.busy.set(true);
    try {
      const options = { cacheBust: true, pixelRatio: 2, backgroundColor: '#f8f5ee' };
      const dataUrl =
        format === 'png'
          ? await toPng(element, options)
          : await toJpeg(element, { ...options, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `${this.filename()}.${format}`;
      link.href = dataUrl;
      link.click();
    } finally {
      this.busy.set(false);
    }
  }
}
