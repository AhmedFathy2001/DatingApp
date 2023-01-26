import { Component, Input, ViewChild } from '@angular/core';
import { Message } from '../../_models/message';
import { MessageService } from '../../_services/message.service';
import { User } from '../../_models/user';
import { AccountService } from '../../_services/account.service';
import { take } from 'rxjs';
import { MediaType, MessageType } from '../../_models/createMessage';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { MessageFormComponent } from './message-form/message-form.component';
import { IMediaFile } from '../../_models/mediafile';

@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css'],
})
export class MemberMessagesComponent {
  @ViewChild(MessageFormComponent) form: MessageFormComponent | undefined;
  @Input() username: string | undefined;
  @Input() messages: Message[] = [];
  user: User | null = null;
  isHovering = false;

  constructor(
    private messageService: MessageService,
    private accountService: AccountService,
    private toastr: ToastrService
  ) {
    this.accountService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (user) this.user = user;
    });
  }

  updateHoveringState(event: boolean) {
    this.isHovering = event;
  }

  sendMessage(event: { content: string; files: File[] | undefined }) {
    const { content, files } = event;

    const mediaFiles: IMediaFile[] = [];
    const maxFileSize = 20 * 1024 * 1024;
    if (!this.username) return;

    if (content.trim().length === 0 && files == null) return;

    let mediaType = MediaType.Image;
    let messageType = MessageType.Text;
    if (files) {
      if (files.length > 6) {
        this.toastr.error('Media count should not exceed 6 per message');
        return;
      }
      messageType = MessageType.Files;
      files.forEach((file) => {
        const fileType = file.type.split('/')[0];

        switch (fileType) {
          case 'image':
            mediaType = MediaType.Image;
            break;
          case 'video':
            mediaType = MediaType.Video;
            break;
          default:
            this.toastr.error(
              'Unsupported media type, supported types: image/video'
            );
            return;
        }

        if (file.size > maxFileSize) {
          this.toastr.error(
            `File size is too large, max file size is 20mb ${file.name}`
          );
          return;
        }
        mediaFiles.push({ file, mediaType });
      });
    }

    this.messageService
      .sendMessage(
        {
          username: this.username,
          content: content,
          messageType,
        },
        mediaFiles
      )
      .subscribe((event: HttpEvent<Message>) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.loaded && event.total && event.total > 0) {
            console.log(event.loaded / event.total);
          }
        } else if (event.type === HttpEventType.Response) {
          if (event.ok) {
            if (this.form) {
              this.form.resetForm();
            }
            if (event.body) {
              this.messages.push(event.body);
              setTimeout(() => {
                const el = document.getElementById('id' + event.body!.id);
                if (el) {
                  this.scrollTo(el);
                }
              }, 0);
            }
          }
        }
      });
  }

  scrollTo(el: HTMLElement, smooth: boolean = true) {
    el.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  updateForm(file: File[]) {
    this.form?.addToQueue(file);
  }
}
