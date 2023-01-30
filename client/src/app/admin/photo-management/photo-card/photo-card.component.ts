import { Component, Input } from '@angular/core';
import { Photo } from '../../../_models/photo';
import { AdminService } from '../../../_services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs';

@Component({
  selector: 'app-photo-card',
  templateUrl: './photo-card.component.html',
  styleUrls: ['./photo-card.component.css'],
})
export class PhotoCardComponent {
  @Input() photo?: Photo;
  isHidden = false;
  hasBeenHidden = false;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) {}

  approvePhoto(id: number) {
    this.adminService
      .approvePhoto(id)
      .pipe(take(1))
      .subscribe(() => {
        this.toastr.success('Photo approved successfully');
        this.isHidden = true;
        setTimeout(() => {
          this.hasBeenHidden = true;
        }, 300);
      });
  }

  rejectPhoto(id: number) {
    this.adminService
      .rejectPhoto(id)
      .pipe(take(1))
      .subscribe(() => {
        this.toastr.success('Photo rejected successfully');
        this.isHidden = true;
        setTimeout(() => {
          this.hasBeenHidden = true;
        }, 300);
      });
  }
}
