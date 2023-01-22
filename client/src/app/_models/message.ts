export interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  senderPhotoUrl: string;
  recipientId: number;
  recipientUsername: string;
  recipientPhotoUrl: string;
  content: string;
  mediaUrl?: string;
  messageType: number;
  dateRead?: Date;
  messageSent: Date;
}
