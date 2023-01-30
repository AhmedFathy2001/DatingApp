import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, take } from 'rxjs';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  providers: [
    {
      provide: BsDropdownConfig,
      useValue: { isAnimated: true, autoClose: true },
    },
  ],
})
export class NavComponent implements OnInit {
  model: any = {};
  currentUser$: Observable<User | null> = of(null);
  @Input() messageCount = 0;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.currentUser$ = this.accountService.currentUser$;
    this.accountService
      .setInitNotifications()
      .pipe(take(1))
      .subscribe((val) => (this.messageCount = val));
    this.accountService.getNotificationsInMessages().subscribe((val) => {
      this.messageCount = val;
    });
  }

  login() {
    this.accountService.login(this.model).subscribe({
      next: (_) => {
        this.router.navigateByUrl('/members');
        this.model = {};
      },
      error: (err: string[]) => {
        err.forEach((error) => this.toastr.error(error));
      },
    });
  }

  logout() {
    this.accountService.logout();
    this.router.navigateByUrl('/');
  }
}
