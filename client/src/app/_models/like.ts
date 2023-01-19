import { User } from './user';

export interface Like {
  sourceUser?: User;
  targetUser?: User;
  targetUserId: number;
  sourceUserId: number;
}
