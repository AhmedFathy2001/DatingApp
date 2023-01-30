import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../_models/user';
import { PresenceService } from './presence.service';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  baseUrl = environment.apiUrl;
  private currentUserSource = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSource.asObservable();

  constructor(
    private http: HttpClient,
    private presenceService: PresenceService,
    private messageService: MessageService
  ) {}

  login(model: any) {
    return this.http.post<User>(`${this.baseUrl}account/login`, model).pipe(
      map((res) => {
        const user = res;
        if (user) {
          this.setCurrentUser(user);
          this.presenceService.createHubConnection(user);
        }
      })
    );
  }

  setCurrentUser(user: User) {
    user.roles = [];

    const roles = this.getDecodedToken(user.token).role;
    Array.isArray(roles) ? (user.roles = roles) : user.roles.push(roles);

    localStorage.setItem('user', JSON.stringify(user));
    this.presenceService.createHubConnection(user);
    this.currentUserSource.next(user);
  }

  register(model: any) {
    return this.http.post<User>(`${this.baseUrl}account/register`, model).pipe(
      map((user) => {
        if (user) {
          this.setCurrentUser(user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
    this.presenceService.stopHubConnection();
  }

  getDecodedToken(token: string) {
    return JSON.parse(atob(token.split('.')[1]));
  }

  setInitNotifications() {
    return this.http.get<number>(`${this.baseUrl}messages/unread-count`);
  }

  getNotifications() {
    return this.presenceService.messageCount$;
  }

  getNotificationsInMessages() {
    return this.messageService.messageCount$;
  }
}
