import { Media } from './media';
import { MediaType } from './createMessage';

export interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  senderPhotoUrl: string;
  recipientId: number;
  recipientUsername: string;
  recipientPhotoUrl: string;
  content: string;
  media: Media[];
  messageType: MediaType;
  dateRead?: Date;
  messageSent: Date;
}
