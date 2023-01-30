import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AccountService } from '../_services/account.service';

@Injectable({
  providedIn: 'root',
})
export class RegisterGuard implements CanActivate {
  constructor(private accountService: AccountService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.accountService.currentUser$.pipe(
      map((user) => {
        if (user) {
          this.router.navigateByUrl('/members');
          return false;
        } else {
          return true;
        }
      })
    );
  }
}
