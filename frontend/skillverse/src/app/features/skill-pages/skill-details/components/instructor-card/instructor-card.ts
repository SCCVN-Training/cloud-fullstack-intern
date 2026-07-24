import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instructor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-card.html',
  styleUrl: './instructor-card.scss',
})
export class InstructorCard {
  instructor = {
    name: 'Elena Rodriguez',
    title: 'Professional Illustrator & Concept Artist',
    bio: `I've been working in the gaming and publishing industry for over
      8 years. My passion is breaking down complex art fundamentals
      into easy, digestible steps so anyone can experience the joy
      of creation.`,
    avatar:
      'https://lh3.googleusercontent.com/aida/AP1WRLs-88Gva7hYobit5iaMjCEmDhuXxK8YXkirjZa9y5ZMfh1tqW01D7rpKu7uXzzIxgwEEa1NEUm9IvWs2jJ0o9HP4wmjscSNNhNJNlv6pPREtC0ffWdLkRVxmrtyzUjMgkyCxQBt1NZNSbpUqJDMfLGqIEHhUFFUJwuzzhYNiOQguLUwi4s7V-E5mvMkQvI3VNPnL6MWsROFGl7pGmNfHK6LtpZmKaDZW_iaQLZv8T2mtXxbVrKK7qnOUBPX',
  };
}
