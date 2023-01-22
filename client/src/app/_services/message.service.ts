import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { getPaginatedResults, getPaginationHeaders } from './paginationHelper';
import { Message } from '../_models/message';
import { ICreateMessage } from '../_models/createMessage';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

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

  sendMessage(createMessage: ICreateMessage, file?: File) {
    const formData = new FormData();

    if (file) {
      formData.append('file', file);
    }

    formData.append('recipientUsername', createMessage.username);
    formData.append('content', createMessage.content);
    formData.append('messageType', createMessage.messageType.toString());

    return this.http.post<Message>(`${this.baseUrl}messages`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  deleteMessage(id: number) {
    return this.http.delete(`${this.baseUrl}messages/${id}`);
  }
}
