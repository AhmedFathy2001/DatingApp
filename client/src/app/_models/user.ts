import { Like } from './like';

export interface User {
  username: string;
  token: string;
  photoUrl: string;
  knownAs: string;
  gender: string;
  likes: Like[];

  roles: string[];
}
