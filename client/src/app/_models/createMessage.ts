export interface ICreateMessage {
  username: string;
  content: string;
  messageType: MessageType;
}

export enum MessageType {
  Text,
  Files,
}

export enum MediaType {
  Image,
  Video,
}
