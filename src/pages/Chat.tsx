/*
 * Chat page hosting the primary ChatWindow workspace.
 */

import { ChatWindow } from '../components/chat/ChatWindow';

export function ChatPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] pb-16 md:pb-0">
      <ChatWindow />
    </div>
  );
}
