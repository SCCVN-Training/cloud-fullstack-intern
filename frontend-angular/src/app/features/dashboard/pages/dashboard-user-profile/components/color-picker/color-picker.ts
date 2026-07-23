import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  templateUrl: './color-picker.html',
  styleUrls: ['./color-picker.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true,
    },
  ],
})
export class ColorPickerComponent implements ControlValueAccessor {
  readonly label = input<string>('Color');
  value: string = '#2563eb';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    if (value) {
      this.value = value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onColorChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onHexInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value.trim();

    // Add # if missing
    if (!value.startsWith('#')) {
      value = '#' + value;
    }

    // Validate hex format
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      this.value = value;
      this.onChange(this.value);
    }
  }

  onBlur(): void {
    this.onTouched();
  }
}
