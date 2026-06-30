export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  image?: {
    mimeType: string;
    data: string; // base64 string
  };
  sources?: { uri: string; title: string }[];
  searchMode?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
