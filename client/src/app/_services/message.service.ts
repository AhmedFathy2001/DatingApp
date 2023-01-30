import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { getPaginatedResults, getPaginationHeaders } from './paginationHelper';
import { Message } from '../_models/message';
import { ICreateMessage } from '../_models/createMessage';
import { IMediaFile } from '../_models/mediafile';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { User } from '../_models/user';
import { BehaviorSubject, take } from 'rxjs';
import { Group } from '../_models/group';
import { BusyService } from './busy.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  baseUrl = environment.apiUrl;
  hubUrl = environment.hubUrl;
  private hubConnection?: HubConnection;
  private messageThreadSource = new BehaviorSubject<Message[]>([]);
  messageThread$ = this.messageThreadSource.asObservable();
  private messageCountSource = new BehaviorSubject<number>(0);
  messageCount$ = this.messageCountSource.asObservable();
  private typingStatusSource = new BehaviorSubject<boolean>(false);
  typingStatus$ = this.typingStatusSource.asObservable();

  constructor(private http: HttpClient, private busyService: BusyService) {}

  createHubConnection(user: User, otherUsername: string) {
    this.busyService.busy();
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}message?user=${otherUsername}`, {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .catch(console.log)
      .finally(() => {
        this.busyService.idle();
      });

    this.hubConnection.on(
      'ReceiveMessageThread',
      ({ messages, notificationCount }) => {
        this.messageThreadSource.next(messages);
        this.messageCountSource.next(notificationCount);
      }
    );

    this.hubConnection.on('UpdatedGroup', (group: Group) => {
      if (group.connections.some((x) => x.username === otherUsername)) {
        this.messageThread$.pipe(take(1)).subscribe({
          next: (messages) => {
            messages.forEach((message) => {
              if (!message.dateRead) {
                message.dateRead = new Date(Date.now());
              }
            });
            this.messageThreadSource.next([...messages]);
          },
        });
      }
    });

    this.hubConnection.on('NewMessage', (message) => {
      this.messageThread$.pipe(take(1)).subscribe({
        next: (messages) => {
          this.messageThreadSource.next([...messages, message]);
        },
      });
    });

    this.hubConnection.on('UserIsTyping', (_, isTyping) => {
      console.log(isTyping);
      this.typingStatusSource.next(isTyping);
    });
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.messageThreadSource.next([]);
      this.hubConnection.stop();
    }
  }

  getMessages(pageNumber: number, pageSize: number, container: string) {
    let params = getPaginationHeaders(pageNumber, pageSize);
    params = params.append('Container', container);
    return getPaginatedResults<Message[]>(
      `${this.baseUrl}messages`,
      params,
      this.http
    );
  }

  getMessageThread(username: string) {
    return this.http.get<Message[]>(
      `${this.baseUrl}messages/thread/` + username
    );
  }

  async updateTyping(recipientUsername: string, isTyping: boolean) {
    return this.hubConnection?.invoke(
      'TypingStatus',
      recipientUsername,
      isTyping
    );
  }

  async sendMessage(createMessage: ICreateMessage, files?: IMediaFile[]) {
    return this.hubConnection
      ?.invoke(
        'SendMessage',
        createMessage.username,
        createMessage.content,
        createMessage.messageType,
        files ? files.map((file) => file.mediaUrl) : null,
        files ? files.map((file) => file.mediaType) : null
      )
      .catch(console.log);
  }

  deleteMessage(id: number) {
    return this.http.delete(`${this.baseUrl}messages/${id}`);
  }
}
