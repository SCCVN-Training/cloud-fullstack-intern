import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core'; // Thêm ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ToastMessage, ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastMessage | null = null;
  private sub!: Subscription;
  private timer: any;

  // Tiêm (Inject) ChangeDetectorRef vào constructor
  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.sub = this.toastService.toastState$.subscribe((toast) => {
      this.toast = toast;
      
      // BẮT BUỘC ANGULAR VẼ LẠI MÀN HÌNH NGAY LẬP TỨC!
      this.cdr.detectChanges(); 

      // Auto close after 3s
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.toast = null;
        
        // Cập nhật lại giao diện khi ẩn Toast đi
        this.cdr.detectChanges(); 
      }, 3000);
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}