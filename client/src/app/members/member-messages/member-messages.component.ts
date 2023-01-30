import { Component, Input, ViewChild } from '@angular/core';
import { MessageService } from '../../_services/message.service';
import { User } from '../../_models/user';
import { AccountService } from '../../_services/account.service';
import { take } from 'rxjs';
import { MediaType, MessageType } from '../../_models/createMessage';
import { ToastrService } from 'ngx-toastr';
import { MessageFormComponent } from './message-form/message-form.component';
import { IMediaFile } from '../../_models/mediafile';
import { BusyService } from '../../_services/busy.service';

@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css'],
})
export class MemberMessagesComponent {
  @ViewChild(MessageFormComponent) form: MessageFormComponent | undefined;
  @Input() username: string | undefined;
  user: User | null = null;
  isHovering = false;

  constructor(
    public messageService: MessageService,
    private accountService: AccountService,
    private toastr: ToastrService,
    private busyService: BusyService
  ) {
    this.accountService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (user) this.user = user;
    });
  }

  updateHoveringState(event: boolean) {
    this.isHovering = event;
  }

  async sendMessage(event: {
    content: string;
    files: File[] | undefined;
    fileUrls: string[] | undefined;
  }) {
    const { content, files } = event;

    const mediaFiles: IMediaFile[] = [];
    if (!this.username) return;

    if (content.trim().length === 0 && files == null) return;

    let messageType = MessageType.Text;
    if (files && event.fileUrls) {
      messageType = MessageType.Files;
      const validatedFiles = this.validateFiles(files, event.fileUrls);
      if (validatedFiles != undefined) {
        mediaFiles.push(...validatedFiles);
      } else {
        return;
      }
    }
    this.busyService.busy();
    this.messageService
      .sendMessage(
        {
          username: this.username,
          content: content,
          messageType,
        },
        mediaFiles
      )
      .then(() => {
        if (this.form) {
          this.form.resetForm();
          this.busyService.idle();
        }
      });
  }

  validateFiles(files: File[], fileUrls: string[]): IMediaFile[] | undefined {
    const maxFileSize = 20 * 1024 * 1024;
    const mediaFiles: IMediaFile[] = [];
    if (files.length > 6 || fileUrls.length !== files.length) {
      this.toastr.error('Media count should not exceed 6 per message');
      return;
    }
    let mediaType = MediaType.Image;
    files.forEach((file, i) => {
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

      mediaFiles.push({ file, mediaType, mediaUrl: fileUrls[i] });
    });

    return mediaFiles;
  }

  updateForm(file: File[]) {
    this.form?.addToQueue(file);
  }
}
