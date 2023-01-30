import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../_services/admin.service';
import { Photo } from '../../_models/photo';

@Component({
  selector: 'app-photo-management',
  templateUrl: './photo-management.component.html',
  styleUrls: ['./photo-management.component.css'],
})
export class PhotoManagementComponent implements OnInit {
  photos: Photo[] = [];

  constructor(private adminService: AdminService) {}

  getPhotosToApprove() {
    this.adminService
      .getPhotosForApproval()
      .subscribe((photos) => (this.photos = photos));
  }

  ngOnInit(): void {
    this.getPhotosToApprove();
  }
}
