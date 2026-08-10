import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Reviewee {
  name: string;
  avatar: string;
}

@Component({
  selector: 'app-session-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-review.html',
  styleUrl: './session-review.scss',
})
export class SessionReview {
  readonly stars = [1, 2, 3, 4, 5];

  reviewee: Reviewee = {
    name: 'Sarah',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZbkCKYP_HEY4Q5mH-uAMmIi4VEZA2uMcldK3MN5QCyvnT9NCEWU0bJAFwrHKJN3E0GDh1YSot5ESdw6Mdmy3R0ln6Iyn1hQlk2mYihj--tOhSVSu2J2K5GiZjH9SeTro7KB_cQzU1MmiLcugasJ6f5GfcTnS2NlANnvt3YEu8-KAub_FqH8WHVklLCf73vsMkMiaOaF8PpaCjIwHK6DMJthActor6VFnWxEJUsJmQlsNxeD9crQlj6Vblpat8iaNZ1JZkCBDNveks',
  };

  overallRating = 0;
  knowledgeRating = 0;
  communicationRating = 0;
  videoAudioRating = 0;

  feedback = '';

  get canSubmit(): boolean {
    return this.overallRating > 0;
  }

  setOverallRating(rating: number): void {
    this.overallRating = rating;
  }

  setKnowledgeRating(rating: number): void {
    this.knowledgeRating = rating;
  }

  setCommunicationRating(rating: number): void {
    this.communicationRating = rating;
  }

  setVideoAudioRating(rating: number): void {
    this.videoAudioRating = rating;
  }

  submitReview(): void {
    if (!this.canSubmit) {
      return;
    }

    const review = {
      reviewee: this.reviewee.name,
      overallRating: this.overallRating,
      knowledgeRating: this.knowledgeRating,
      communicationRating: this.communicationRating,
      videoAudioRating: this.videoAudioRating,
      feedback: this.feedback.trim(),
    };

    console.log('Review submitted:', review);
  }
}
