import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Member } from '../../_models/member';
import { User } from '../../_models/user';
import { AccountService } from '../../_services/account.service';
import { MembersService } from '../../_services/members.service';
import { take } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';
import { SeoService } from '../../_services/seo.service';

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css'],
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm') editForm: NgForm | undefined;
  member: Member | undefined;
  user: User | null = null;

  constructor(
    private accountService: AccountService,
    private memberService: MembersService,
    private toastr: ToastrService,
    private seoService: SeoService
  ) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: (user) => (this.user = user),
    });

    this.seoService.updateTitleAndMeta(
      'Edit Profile',
      'Attract the right matches by keeping your profile up-to-date. Edit your profile information and photos on our dating app.'
    );
  }

  @HostListener('window:beforeunload', ['$event']) unloadNotification(
    $event: any
  ) {
    if (this.editForm?.dirty) {
      $event.returnValue = true;
    }
  }

  ngOnInit(): void {
    this.loadMember();
  }

  loadMember() {
    if (!this.user) return;
    this.memberService.getMember(this.user.username).subscribe({
      next: (member) => (this.member = member),
    });
  }

  updateMember() {
    this.memberService.updateMember(this.editForm?.value).subscribe({
      next: (_) => {
        this.toastr.success('Profile updated successfully!');
        this.editForm?.reset(this.member);
      },
    });
  }
}
