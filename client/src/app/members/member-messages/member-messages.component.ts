import {
  Component,
  DoCheck,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Message } from '../../_models/message';
import { MessageService } from '../../_services/message.service';
import {
  faCirclePlay,
  faClock,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { User } from '../../_models/user';
import { AccountService } from '../../_services/account.service';
import { take } from 'rxjs';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { MessageType } from '../../_models/createMessage';
import { ToastrService } from 'ngx-toastr';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';

//clean up this component to separate components, form, message box, and message
@Component({
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css'],
})
export class MemberMessagesComponent implements OnInit, DoCheck {
  @ViewChild('messageForm') messageForm: NgForm | undefined;
  @ViewChild('chat') chatbox: ElementRef | undefined;
  @Input() username: string | undefined;
  @Input() messages: Message[] = [];
  faClock = faClock;
  faImage = faImage;
  user: User | null = null;
  mediaFile: string | ArrayBuffer | null = null;
  file: File | undefined;
  content: string = '';
  faCirclePlay = faCirclePlay;
  openedFileSrc: string | undefined;
  openedFileType: MessageType | undefined;
  openedFileContent: string | undefined;
  modalRef?: BsModalRef;
  fragment: string | null = null;
  hasLoaded = false;

  constructor(
    private messageService: MessageService,
    private accountService: AccountService,
    private toastr: ToastrService,
    private modalService: BsModalService,
    private route: ActivatedRoute
  ) {
    this.accountService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (user) this.user = user;
    });
  }

  openModal(
    content: TemplateRef<any>,
    mediaUrl: string,
    messageType: MessageType,
    openedFileContent?: string
  ) {
    this.openedFileSrc = mediaUrl;
    this.openedFileType = messageType;
    this.openedFileContent = openedFileContent;
    this.modalRef = this.modalService.show(content, {
      class: 'modal-dialog-centered',
    });
  }

  sendMessage() {
    const maxFileSize = 20 * 1024 * 1024;
    if (!this.username) return;

    if (this.content.trim().length === 0 && this.file == null) return;

    let messageType = MessageType.Text;

    if (this.file) {
      const fileType = this.file.type.split('/')[0];
      if (fileType === 'image') {
        messageType = MessageType.Image;
      } else if (fileType === 'video') {
        messageType = MessageType.Video;
      } else {
        this.file = undefined;
        messageType = MessageType.Text;
        this.toastr.error(
          'Unsupported media type, supported types: image/video'
        );
        return;
      }

      if (this.file.size > maxFileSize) {
        this.file = undefined;
        messageType = MessageType.Text;
        this.toastr.error('File size is too large, max file size is 20mb');
        return;
      }
    }

    this.messageService
      .sendMessage(
        {
          username: this.username,
          content: this.content,
          messageType,
        },
        this.file
      )
      .subscribe((event: HttpEvent<Message>) => {
        if (event.type === HttpEventType.Response) {
          console.log(event.body);
          if (event.ok) {
            this.resetForm();
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

  addToQueue(event: File[] | Event) {
    let file: File | null = null;
    if ('target' in event) {
      const target = event.target as HTMLInputElement;
      if (target && target.files) file = target.files[0];
    } else {
      if (FileReader && event.length > 0) {
        file = event[0];
      }
    }

    const fr = new FileReader();
    fr.onload = () => {
      this.mediaFile = fr.result;
    };
    if (file) {
      this.file = file;
      fr.readAsDataURL(file);
    }
  }

  clearMedia() {
    this.file = undefined;
    this.mediaFile = null;
  }

  resetForm() {
    this.messageForm?.reset();
    this.clearMedia();
  }

  scrollTo(el: HTMLElement, smooth: boolean = true) {
    el.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  ngDoCheck(): void {
    const fragment = this.route.snapshot.fragment;
    if (!this.chatbox && !fragment) return;
    let el = document.getElementById(fragment ?? '');
    if (!el && this.chatbox) {
      el = document.getElementById(
        this.chatbox.nativeElement.lastChild.previousSibling.querySelector(
          '.chat-body'
        ).id
      );
    }

    if (el && !this.hasLoaded) {
      this.hasLoaded = true;
      this.scrollTo(el, !(fragment === null));
      this.fragment = fragment;
      setTimeout(() => {
        this.fragment = null;
      }, 2000);
    }
  }

  ngOnInit(): void {}
}
