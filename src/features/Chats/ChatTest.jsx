import React, { useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const ChatTest = () => {
  const [senderId, setSenderId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const clientRef = useRef(null);

  const chatRoomId = 1;

  const connect = (id) => {
    const socket = new SockJS('https://port-0-portiony-backend-md4272k5c4648749.sel5.cloudtype.app/ws-chat-sockjs');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log('✅ Connected!');
        setConnected(true);
        setSenderId(id);
        client.subscribe(`/sub/chat/room/${chatRoomId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('[📩 받은 메시지]', body);
          setChatMessages((prev) => [...prev, body]);
        });
      },
      onStompError: (frame) => {
        console.error('❌ Broker error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;
  };

  const sendMessage = () => {
    if (clientRef.current && connected && messageInput) {
      const payload = {
        chatRoomId,
        senderId,
        content: messageInput,
      };
      clientRef.current.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify(payload),
      });
      setMessageInput('');
    }
  };

  const sendSystemMessage = () => {
    if (clientRef.current && connected) {
      const systemPayload = {
        chatRoomId,
        senderId,
        content: '📢 시스템 메시지 테스트입니다!',
        isSystem: true,
        systemType: 'test',
      };
      clientRef.current.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify(systemPayload),
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>💬 실시간 채팅 테스트</h2>
      {!connected && (
        <>
          <button onClick={() => connect(1)}>🔵 사용자 1 (ID: 1) 접속</button>
          <button onClick={() => connect(6)} style={{ marginLeft: '10px' }}>
            🟢 사용자 6 (ID: 6) 접속
          </button>
        </>
      )}
      {connected && (
        <>
          <div style={{ marginTop: '20px' }}>
            <strong>접속된 사용자 ID: {senderId}</strong>
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="메시지를 입력하세요"
              />
              <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
                보내기
              </button>
              <button onClick={sendSystemMessage} style={{ marginLeft: '10px', backgroundColor: '#f0f0f0' }}>
                📡 시스템 메시지 보내기
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3>📨 메시지 로그</h3>
            <ul>
              {chatMessages.map((msg, index) => (
                <li key={index} style={{ color: msg.isSystem ? 'blue' : 'black', fontStyle: msg.isSystem ? 'italic' : 'normal' }}>
                  {msg.isSystem ? (
                    <span>📣 [시스템 메시지] {msg.content}</span>
                  ) : (
                    <span>
                      <b>{msg.senderId === senderId ? '나' : `상대(${msg.senderId})`}</b>: {msg.content}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatTest;
