import { useState } from 'react';
import type { FormEvent } from 'react';
import { Conversation } from './components/Conversation';
import { LoginScreen } from './components/LoginScreen';
import { NewChatModal } from './components/NewChatModal';
import { Sidebar } from './components/Sidebar';
import { useChat } from './hooks/useChat';
import styles from './App.module.css';

export function App() {
  const chat = useChat();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const activeChat = chat.chats.find(item => item.id === chat.selected);

  async function createChat(event: FormEvent<HTMLFormElement>) {
    if (await chat.createChat(event)) {
      setNewChatOpen(false);
      setMobileChat(true);
    }
  }

  return <div className={styles.shell}>
    <div className={styles.topLine} />
    <main className={`${styles.messenger} ${mobileChat ? styles.mobileChatOpen : ''}`}>
      <Sidebar chats={chat.chats} selected={chat.selected} instanceId={chat.credentials?.idInstance || ''} pollError={chat.pollError} onSelect={id => { chat.selectChat(id); setMobileChat(true); }} onNewChat={() => { chat.setNewError(''); setNewChatOpen(true); }} onDisconnect={() => { chat.disconnect(); setMobileChat(false); }} />
      <Conversation chat={activeChat} draft={chat.draft} sending={chat.sending} sendError={chat.sendError} pollError={chat.pollError} onDraft={chat.setDraft} onSend={chat.sendMessage} onBack={() => setMobileChat(false)} onNewChat={() => setNewChatOpen(true)} />
    </main>
    {!chat.credentials && <LoginScreen form={chat.form} setForm={chat.setForm} busy={chat.connectBusy} error={chat.connectError} onConnect={chat.connect} />}
    {newChatOpen && chat.credentials && <NewChatModal phone={chat.phone} error={chat.newError} busy={chat.newBusy} onPhone={chat.setPhone} onClose={() => setNewChatOpen(false)} onCreate={createChat} />}
  </div>;
}
