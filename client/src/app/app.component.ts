import { Component, OnInit } from '@angular/core';
import { User } from './_models/user';
import { AccountService } from './_services/account.service';
import { SeoService } from './_services/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Dating App';
  users: any;
  messageCount = 0;

  constructor(
    private accountService: AccountService,
    private seoService: SeoService
  ) {
    this.seoService.updateTitleAndMeta('Loading...', 'Loading...');
  }

  ngOnInit() {
    this.setCurrentUser();
  }

  setCurrentUser() {
    const userString = localStorage.getItem('user');

    if (!userString) return;

    const user: User = JSON.parse(userString);
    this.accountService.setCurrentUser(user);
    this.accountService
      .getNotifications()
      .subscribe((val) => (this.messageCount = val));
  }
}
