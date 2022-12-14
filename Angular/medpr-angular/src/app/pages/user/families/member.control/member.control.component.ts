import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { Member } from 'src/app/models/member';
import { MembersActionsService } from 'src/app/services/members/members.actions.service';
import { MembersService } from 'src/app/services/members/members.service';
import { selectUserId } from 'src/app/store/app.states';

@Component({
  selector: 'member-control',
  templateUrl: './member.control.component.html',
  styleUrls: ['./member.control.component.scss']
})
export class MemberControlComponent implements OnInit {
  @Input() member?: Member;
  @Input() isCurrentUserAdmin?: boolean;
  isCurrentUserMember?: boolean = false;
  memberName?: string;
  showSpinner: boolean = false;

  constructor(private actions: MembersActionsService,
    private memberService: MembersService,
    private toastr: ToastrService,
    private store: Store,
    ) { }

  ngOnInit(): void {
    this.store.select(selectUserId).pipe().subscribe((currentUserId) => {
      if (currentUserId == this.member?.user!['id']) {
        this.isCurrentUserMember = true;
      }
    });

    if (this.member?.user?.fullName){
      this.memberName = this.member?.user?.fullName
    } else {
      let dogIndex = this.member?.user?.login.lastIndexOf('@');
      this.memberName = this.member?.user?.login.substring(0, dogIndex);
    }
  }

  makeAdmin() {
    if (this.isCurrentUserAdmin && !this.member?.isAdmin){
      this.showSpinner = true;
      let updateMember: Member = {
        id: this.member?.id!,
        isAdmin: true,
        userId: this.member?.user!['id']!,
        familyId: this.member?.familyId!
      }

      this.memberService.makeAdmin(updateMember).pipe().subscribe({
        next: (member) => {
          this.showSpinner = false;
          this.actions.emitMemberResponse(member);
          this.toastr.success(`${this.memberName} is now admin`, `Success`);
        },
        error: (err) => {
          this.showSpinner = false;
          console.log(`${err}`);
          this.toastr.error(`${this.memberName} is still the same`, `Failed`);
        }
      });
    }
  }

  makeCasual(){
    if (this.isCurrentUserAdmin && this.member?.isAdmin){
      this.showSpinner = true;
      let updateMember: Member = {
        id: this.member?.id!,
        isAdmin: false,
        userId: this.member?.user!['id']!,
        familyId: this.member?.familyId!
      }

      this.memberService.makeAdmin(updateMember).pipe().subscribe({
        next: (member) => {
          this.showSpinner = false;
          this.actions.emitMemberResponse(member);
          this.toastr.success(`${this.memberName} is now casual`, `Success`);
        },
        error: (err) => {
          this.showSpinner = false;
          console.log(`${err}`);
          this.toastr.error(`${this.memberName} is still the same`, `Failed`);
        }
      });
    }
  }

  removeMember() {
    if (this.isCurrentUserAdmin || this.isCurrentUserMember){
      this.memberService.delete(this.member?.id!).pipe().subscribe({
        next: () => {
          this.showSpinner = false;
          this.toastr.success(`${this.memberName} removed from family`, `Success`);
          this.actions.emitMemberDelete(this.member!.id);
        },
        error: (err) => {
          this.showSpinner = false;
          this.toastr.warning(`${this.memberName} is still a member`, `Failed`);
          console.log(`${err.message}`);
        },
      })
    }
  }
}
