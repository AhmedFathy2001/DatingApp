import { Component, OnInit } from '@angular/core';
import { Member } from 'src/app/_models/member';
import { MembersService } from 'src/app/_services/members.service';
import { Pagination } from '../../_models/pagination';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { UserParams } from '../../_models/userParams';
import { SeoService } from '../../_services/seo.service';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.css'],
})
export class MemberListComponent implements OnInit {
  members: Member[] = [];
  pagination: Pagination | undefined;
  userParams: UserParams | undefined;

  genderList = [
    {
      value: 'male',
      display: 'Males',
    },
    {
      value: 'female',
      display: 'Females',
    },
  ];

  constructor(
    private memberService: MembersService,
    private seoService: SeoService
  ) {
    this.userParams = this.memberService.getUserParams();

    this.seoService.updateTitleAndMeta(
      'My matches',
      'Start a conversation and get to know someone special. Browse through your curated list of matches on our dating app.'
    );
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers() {
    if (this.userParams) {
      this.memberService.setUserParams(this.userParams);
      this.memberService.getMembers(this.userParams).subscribe({
        next: (response) => {
          if (response.result && response.pagination) {
            this.members = response.result;
            this.pagination = response.pagination;
          }
        },
      });
    }
  }

  resetFilters() {
    this.userParams = this.memberService.resetUserParams();
    this.loadMembers();
  }

  applyFilters() {
    if (!this.userParams) return;
    this.userParams.pageNumber = 1;
    this.memberService.setUserParams(this.userParams);
    this.loadMembers();
  }

  pageChanged(event: PageChangedEvent) {
    if (!this.userParams) return;
    if (this.userParams.pageNumber !== event.page) {
      this.userParams.pageNumber = event.page;
      this.memberService.setUserParams(this.userParams);
      this.loadMembers();
    }
  }
}
