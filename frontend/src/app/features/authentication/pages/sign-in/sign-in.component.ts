import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // 1. Import the Router

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent {
  private fb = inject(FormBuilder);
  
  // 2. Inject the Angular Router service
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false]
  });

  onSubmit(): void {
    if (this.form.valid) {
      // Typically, you would call an authentication service here first.
      // Once auth is successful, execute the routing metric below:
      
      // 3. Navigate the user to the main dashboard route
      this.router.navigate(['/dashboard']); 
    }
  }
}