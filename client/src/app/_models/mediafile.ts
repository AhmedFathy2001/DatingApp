import { MediaType } from './createMessage';

export interface IMediaFile {
  file: File;
  mediaType: MediaType;
  mediaUrl: string;
}
