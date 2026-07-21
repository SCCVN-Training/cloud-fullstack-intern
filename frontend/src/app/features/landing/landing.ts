import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HostBinding } from '@angular/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss'],
})
export class Landing {
  // Brand size control (px) for logo + name scaling on the landing page
  brandSize = 50;

  @HostBinding('style.--brand-size') get cssBrandSize() {
    return this.brandSize + 'px';
  }
}
