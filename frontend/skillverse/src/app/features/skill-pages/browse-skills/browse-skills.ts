import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-browse-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browse-skills.html',
  styleUrls: ['./browse-skills.scss']
})
export class BrowseSkillsPage {

  isSearchEmpty = false;

  onSearch(value: string) {
    if (value.toLowerCase() === 'empty') {
      this.isSearchEmpty = true;
    } else {
      this.isSearchEmpty = false;
    }
  }

  clearFilters() {
    this.isSearchEmpty = false;
  }
}
