import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private firestore: Firestore) {}

  getChatId(userId: string, contactId: string): string {
    return userId < contactId
      ? `${userId}_${contactId}`
      : `${contactId}_${userId}`;
  }

  getMessages(chatId: string): Observable<any[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  sendMessage(chatId: string, from: string, to: string, text: string) {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    return addDoc(messagesRef, {
      type: 'text',
      from,
      to,
      text,
      timestamp: Timestamp.now(),
    });
  }
}
