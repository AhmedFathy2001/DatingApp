import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { User } from '../_models/user';
import { BehaviorSubject, take } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  hubUrl = environment.hubUrl;
  private hubConnection?: HubConnection;
  private onlineUsersSource = new BehaviorSubject<string[]>([]);
  onlineUsers$ = this.onlineUsersSource.asObservable();
  private messageCountSource = new BehaviorSubject<number>(0);
  messageCount$ = this.messageCountSource.asObservable();

  constructor(private toastr: ToastrService, private router: Router) {}

  createHubConnection(user: User) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}presence`, {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch(console.log);

    this.hubConnection.on('UserIsOnline', (username) => {
      this.onlineUsers$.pipe(take(1)).subscribe((usernames) => {
        this.onlineUsersSource.next([...usernames, username]);
      });
    });

    this.hubConnection.on('UserIsOffline', (username) => {
      this.onlineUsers$.pipe(take(1)).subscribe((usernames) => {
        this.onlineUsersSource.next(usernames.filter((x) => x !== username));
      });
    });

    this.hubConnection.on('GetOnlineUsers', (usernames) => {
      this.onlineUsersSource.next(usernames);
    });

    this.hubConnection.on(
      'NewMessageReceived',
      ({ username, knownAs, notificationCount }) => {
        this.toastr
          .info(`${knownAs} has sent you a message.`)
          .onTap.pipe(take(1))
          .subscribe(() => {
            this.router.navigateByUrl(`/members/${username}?tab=Messages`);
          });

        this.messageCountSource.next(notificationCount);
      }
    );
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop().catch(console.log);
    }
  }
}
