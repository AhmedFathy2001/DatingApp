import { Component, OnInit } from '@angular/core';
import { Message } from '../_models/message';
import { Pagination } from '../_models/pagination';
import { MessageService } from '../_services/message.service';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import {
  faEnvelope,
  faEnvelopeOpen,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { SeoService } from '../_services/seo.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessagesComponent implements OnInit {
  loading = false;
  messages: Message[] | undefined;
  pagination: Pagination | undefined;
  container = 'Unread';
  pageNumber = 1;
  pageSize = 5;
  faEnvelope = faEnvelope;
  faEnvelopeOpen = faEnvelopeOpen;
  faPaperPlane = faPaperPlane;

  constructor(
    private messageService: MessageService,
    private seoService: SeoService
  ) {
    this.seoService.updateTitleAndMeta(
      'Messages',
      'Stay in touch with your matches and build deeper relationships. Access your unread messages, inbox, and outbox on our messaging page.'
    );
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages() {
    this.loading = true;
    this.messageService
      .getMessages(this.pageNumber, this.pageSize, this.container)
      .subscribe({
        next: (response) => {
          this.messages = response.result;
          this.pagination = response.pagination;
          this.loading = false;
        },
      });
  }

  pageChanged(event: PageChangedEvent) {
    if (this.pageNumber !== event.page) {
      this.pageNumber = event.page;
      this.loadMessages();
    }
  }

  deleteMessage(id: number) {
    this.messageService.deleteMessage(id).subscribe({
      next: () =>
        this.messages?.splice(
          this.messages.findIndex((m) => m.id === id),
          1
        ),
    });
  }
}
