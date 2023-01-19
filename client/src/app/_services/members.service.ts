import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Member } from '../_models/member';
import { map, of, Subscription } from 'rxjs';
import { PaginatedResult } from '../_models/pagination';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';
import { User } from '../_models/user';
import { Like } from '../_models/like';

@Injectable({
  providedIn: 'root',
})
export class MembersService implements OnDestroy {
  baseUrl = environment.apiUrl;
  members: Member[] = [];

  memberCache = new Map();
  userParams: UserParams | undefined;
  user: User | undefined;
  user$: Subscription;

  likes: Like[] | undefined;

  constructor(
    private http: HttpClient,
    private accountService: AccountService
  ) {
    this.user$ = accountService.currentUser$.pipe().subscribe({
      next: (user) => {
        if (user) {
          this.userParams = new UserParams(user);
          this.user = user;
          this.likes = user.likes;
          this.members = this.members.map((member) => {
            return {
              ...member,
              isLiked: !!this.user?.likes.find(
                (like) => like.targetUserId === member.id
              ),
            };
          });
          this.resetUserParams();
        }
      },
    });
  }

  getUserParams() {
    return this.userParams;
  }

  setUserParams(params: UserParams) {
    if (params.pageNumber !== this.userParams?.pageNumber)
      params.pageNumber = 1;
    this.userParams = params;
  }

  resetUserParams() {
    if (!this.user) return;
    this.userParams = new UserParams(this.user);
    return this.userParams;
  }

  getMembers(userParams: UserParams) {
    const response = this.memberCache.get(Object.values(userParams).join('-'));

    if (response) return of(response);

    let params = this.getPaginationHeaders(
      userParams.pageNumber,
      userParams.pageSize
    );

    params = params.append('minAge', userParams.minAge);
    params = params.append('maxAge', userParams.maxAge);
    params = params.append('gender', userParams.gender);
    params = params.append('orderBy', userParams.orderBy);

    if (userParams.username) {
      params = params.append('searchByUsername', userParams.username);
    }

    return this.getPaginatedResults<Member[]>(
      `${this.baseUrl}users`,
      params
    ).pipe(
      map((response) => {
        this.memberCache.set(Object.values(userParams).join('-'), response);
        return response;
      })
    );
  }

  getMember(username: string) {
    this.members = Array.from(
      new Set(
        [...this.memberCache.values()].reduce(
          (arr, elem) => arr.concat(elem.result),
          []
        )
      )
    );

    const member = this.members.find((user) => user.userName === username);

    if (member) return of(member);

    return this.http.get<Member>(`${this.baseUrl}users/${username}`);
  }

  updateMember(member: Member) {
    return this.http.put(`${this.baseUrl}users`, member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = { ...this.members[index], ...member };
      })
    );
  }

  setMainPhoto(photoId: number) {
    return this.http.put(`${this.baseUrl}users/set-main-photo/${photoId}`, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(`${this.baseUrl}users/delete-photo/${photoId}`);
  }

  addLike(username: string) {
    return this.http.post(`${this.baseUrl}likes/${username}`, {});
  }

  removeLike(username: string) {
    return this.http.delete(`${this.baseUrl}likes/${username}`);
  }

  getLikes(isLiked: boolean, pageNumber: number, pageSize: number) {
    let params = this.getPaginationHeaders(pageNumber, pageSize);

    params = params.append('isLiked', isLiked);

    return this.getPaginatedResults<Member[]>(`${this.baseUrl}likes`, params);
  }

  ngOnDestroy(): void {
    this.user$.unsubscribe();
  }

  private getPaginationHeaders(pageNumber: number, pageSize: number) {
    let params = new HttpParams();
    params = params.append('pageNumber', pageNumber);
    params = params.append('pageSize', pageSize);

    return params;
  }

  private getPaginatedResults<T>(url: string, params: HttpParams) {
    const paginatedResult: PaginatedResult<T> = new PaginatedResult<T>();
    return this.http.get<T>(url, { observe: 'response', params }).pipe(
      map((response) => {
        if (response.body) {
          paginatedResult.result = response.body;
        }
        const pagination = response.headers.get('Pagination');
        if (pagination) {
          paginatedResult.pagination = JSON.parse(pagination);
        }
        console.log(paginatedResult.pagination);
        return paginatedResult;
      })
    );
  }
}
