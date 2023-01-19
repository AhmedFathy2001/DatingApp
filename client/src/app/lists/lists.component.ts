import { Component, OnInit } from '@angular/core';
import { Member } from '../_models/member';
import { MembersService } from '../_services/members.service';
import { Pagination } from '../_models/pagination';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.css'],
})
export class ListsComponent implements OnInit {
  members: Member[] | undefined;
  isLiked = true;
  pageNumber = 1;
  pageSize = 6;
  pagination: Pagination | undefined;
  componentOpacity = 1;

  constructor(private memberService: MembersService) {}

  onLikeRemoved = (member: Member) => {
    // if (!member) return;
    this.loadLikes();
  };

  loadLikes() {
    this.componentOpacity = 0;
    this.memberService
      .getLikes(this.isLiked, this.pageNumber, this.pageSize)
      .subscribe({
        next: (response) => {
          this.members = response.result;
          this.pagination = response.pagination;
          this.componentOpacity = 1;
        },
      });
    return;
  }

  pageChanged(event: PageChangedEvent) {
    if (!this.pageNumber) return;
    if (this.pageNumber !== event.page) {
      this.pageNumber = event.page;
      this.loadLikes();
    }
  }

  ngOnInit(): void {
    this.loadLikes();
  }
}
