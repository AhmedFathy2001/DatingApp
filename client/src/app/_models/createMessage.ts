export interface ICreateMessage {
  username: string;
  content: string;
  messageType: MessageType;
}

export enum MessageType {
  Text,
  Image,
  Video,
}
