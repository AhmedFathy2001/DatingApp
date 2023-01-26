import { Component, OnInit, ViewChild } from '@angular/core';
import { Member } from '../../_models/member';
import { ActivatedRoute } from '@angular/router';
import { MembersService } from '../../_services/members.service';
import {
  NgxGalleryAnimation,
  NgxGalleryImage,
  NgxGalleryOptions,
} from '@kolkov/ngx-gallery';
import { ToastrService } from 'ngx-toastr';
import { TabDirective, TabsetComponent } from 'ngx-bootstrap/tabs';
import { MessageService } from '../../_services/message.service';
import { Message } from '../../_models/message';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css'],
})
export class MemberDetailComponent implements OnInit {
  @ViewChild('memberTabs', { static: true }) memberTabs:
    | TabsetComponent
    | undefined;
  messages: Message[] = [];

  member: Member = {} as Member;
  galleryOptions: NgxGalleryOptions[] = [];
  galleryImages: NgxGalleryImage[] = [];
  activeTab: TabDirective | undefined;

  constructor(
    private memberService: MembersService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.data.subscribe({
      next: (data) => (this.member = data['member']),
    });
    this.route.queryParams.subscribe({
      next: (params) => {
        params['tab'] && this.selectTab(params['tab']);
      },
    });

    this.galleryOptions = [
      {
        width: '500px',
        height: '500px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false,
      },
    ];

    this.galleryImages = this.getImages();
  }

  getImages() {
    if (!this.member) return [];

    const imageUrls = [];

    for (const photo of this.member.photos) {
      imageUrls.push({
        small: photo.url,
        medium: photo.url,
        big: photo.url,
      });
    }

    return imageUrls;
  }

  addLike(member: Member) {
    this.memberService.addLike(member.userName).subscribe({
      next: () => {
        if (!this.member) return;
        this.member.isLiked = true;
        this.toastr.success(`You have liked ${member.knownAs}`);
      },
    });
  }

  removeLike(member: Member) {
    this.memberService.removeLike(member.userName).subscribe({
      next: () => {
        if (!this.member) return;
        this.member.isLiked = false;
        this.toastr.success(`You have unliked ${member.knownAs}`);
      },
    });
  }

  onTabActivated(data: TabDirective) {
    this.activeTab = data;
    if (this.activeTab.heading === 'Messages') {
      this.loadMessages();
    }
  }

  loadMessages() {
    if (this.member) {
      this.messageService.getMessageThread(this.member.userName).subscribe({
        next: (messages) => {
          this.messages = messages;
        },
      });
    }
  }

  selectTab(heading: string) {
    if (this.memberTabs) {
      const headingItem = this.memberTabs.tabs.find(
        (h) => h.heading === heading
      );
      if (headingItem) {
        headingItem.active = true;
      }
    }
  }
}
