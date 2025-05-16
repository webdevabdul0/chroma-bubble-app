import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export type Chat = {
  id: string;
  title: string;
  systemMessage: string;
  createdAt: any;
  userId: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: any;
  userId: string;
};

export async function createChat(title: string, systemMessage: string, userId: string): Promise<string> {
  const chatRef = await addDoc(collection(db, 'chats'), {
    title,
    systemMessage,
    createdAt: serverTimestamp(),
    userId,
  });
  return chatRef.id;
}

export async function getChats(userId?: string): Promise<Chat[]> {
  const snapshot = await getDocs(collection(db, 'chats'));
  let chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
  if (userId) chats = chats.filter(chat => chat.userId === userId);
  return chats;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
}

// Note: userId is required for Firestore security rules
export async function addMessageToChat(chatId: string, message: Omit<ChatMessage, 'id'>) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), message);
}

export async function updateSystemMessage(chatId: string, systemMessage: string) {
  const chatDoc = doc(db, 'chats', chatId);
  await updateDoc(chatDoc, { systemMessage });
}

export const updateChatTitle = async (chatId: string, title: string) => {
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      title,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
}; 