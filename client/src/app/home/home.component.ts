import { Component, OnInit } from '@angular/core';
import { SeoService } from '../_services/seo.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  registerMode = false;

  constructor(private seoService: SeoService) {
    this.seoService.updateTitleAndMeta(
      'Home',
      "Find love and make meaningful connections with others. Login or register on our dating app's home page today."
    );
  }

  ngOnInit() {}

  registerToggle() {
    this.registerMode = !this.registerMode;
  }

  cancelRegisterMode(event: boolean) {
    this.registerMode = event;
  }
}
