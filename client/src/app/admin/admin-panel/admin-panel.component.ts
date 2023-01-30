import { Component } from '@angular/core';
import { SeoService } from '../../_services/seo.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
})
export class AdminPanelComponent {
  constructor(private seoService: SeoService) {
    this.seoService.updateTitleAndMeta(
      "Moderator's Panel",
      'Ensure a safe and enjoyable environment for everyone on our dating app. Manage user accounts and photos as a moderator or admin.'
    );
  }
}
