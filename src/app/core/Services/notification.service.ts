import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  show(icon: SweetAlertIcon, title: string, message?: string): Promise<unknown> {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      text: message,
      showConfirmButton: false,
      timer: icon === 'success' ? 2600 : 4200,
      timerProgressBar: true,
      customClass: { popup: 'app-toast', title: 'app-toast__title', htmlContainer: 'app-toast__message' },
    });
  }

  success(title: string, message?: string): Promise<unknown> { return this.show('success', title, message); }
  error(title: string, message?: string): Promise<unknown> { return this.show('error', title, message); }
  warning(title: string, message?: string): Promise<unknown> { return this.show('warning', title, message); }
}
