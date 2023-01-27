import { Component, Input } from '@angular/core';
import { Member } from '../../_models/member';
import { MembersService } from '../../_services/members.service';
import { ToastrService } from 'ngx-toastr';
import {
  faEnvelope,
  faHeart,
  faHeartCrack,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { PresenceService } from '../../_services/presence.service';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.css'],
})
export class MemberCardComponent {
  @Input() member: Member | undefined;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faHeart = faHeart;
  faHeartCrack = faHeartCrack;
  @Input() onLikeRemoved?: (member: Member) => void;

  constructor(
    private memberService: MembersService,
    private toastr: ToastrService,
    public presenceService: PresenceService
  ) {}

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
        if (this.onLikeRemoved) {
          this.onLikeRemoved(member);
        }
      },
    });
  }
}
