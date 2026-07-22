import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButton],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {}
