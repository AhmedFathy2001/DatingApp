import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Message } from '../../../_models/message';
import { faCirclePlay, faClock } from '@fortawesome/free-solid-svg-icons';
import { MediaType } from '../../../_models/createMessage';
import { MediaModalComponent } from '../../../modals/media-modal/media-modal.component';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../_services/message.service';

//implement scroll to bottom of the chat
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  @ViewChild(MediaModalComponent) modal: MediaModalComponent | undefined;
  @Input() username: string | undefined;
  // @Input() messages: Message[] = [];
  fragment: string | null = null;
  faClock = faClock;
  faCirclePlay = faCirclePlay;

  previewContent: string | undefined;
  previewSrc: string | undefined;
  previewType: MediaType | undefined;

  @Output() fileDropped = new EventEmitter<File[]>();
  @Output() isHovering = new EventEmitter<boolean>();
  messages: Message[] = [];

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    messageService.messageThread$.subscribe((messages) => {
      this.messages = messages;
    });
    if (this.route.snapshot.fragment) {
      this.fragment = this.route.snapshot.fragment;
      setTimeout(() => {
        this.fragment = null;
      }, 2000);
    }
  }

  onDragOver(event: boolean) {
    this.isHovering.emit(event);
  }

  onDrop(event: File[]) {
    const files = event;
    if (!files) return;

    this.fileDropped.emit(Array.from(files));
  }

  openModal(message: Message, id: number) {
    if (!this.modal) return;
    const file = message.media.find((m) => m.id === id);
    if (!file) return;

    this.previewContent = message.content;
    this.previewType = file.type;
    this.previewSrc = file.url;
    this.modal.openModal();
  }
}
