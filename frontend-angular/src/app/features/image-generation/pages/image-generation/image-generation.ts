import { Component } from '@angular/core';
import { Reviews } from '../../components/reviews/reviews';

@Component({
  selector: 'app-image-generation',
  standalone: true,
  imports: [Reviews],
  templateUrl: './image-generation.html',
  styleUrl: './image-generation.scss',
})
export class ImageGeneration {}
