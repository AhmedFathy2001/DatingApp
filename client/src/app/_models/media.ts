import { MediaType } from './createMessage';

export interface Media {
  id: number;
  url: string;
  publicId: string;
  type: MediaType;
}
