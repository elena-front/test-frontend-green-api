export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  outgoing: boolean;
  timestamp: number;
}

export interface Chat {
  id: string;
  phone: string;
  name: string;
  messages: ChatMessage[];
  unread: number;
}

export interface NotificationBody {
  typeWebhook?: string;
  idMessage?: string;
  timestamp?: number;
  senderData?: { chatId?: string; sender?: string; chatName?: string; senderName?: string };
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
}

export interface NotificationEnvelope {
  receiptId: number;
  body: NotificationBody;
}
