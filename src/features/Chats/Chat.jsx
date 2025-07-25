import React, { useState, useRef, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import boxImage from '../../assets/chat_logo.png';
import styles from './Chats.module.css';
import Dropdown from '../../components/DropDown/DropDown';
import ChatListItem from '../../components/Chat/ChatListItem/ChatListItem';
import ChatHeader from '../../components/Chat/ChatHeader/ChatHeader';
import ChatBottom from '../../components/Chat/ChatBottom/ChatBottom';
import ChatMessage from '../../components/Chat/ChatMessage/ChatMessage';

import profileImg from '../../assets/profile.png';
import postImage from '../../assets/product.png'; //상품 이미지

function Chat() {
  const myName = '남예은';
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const BASE_URL = 'https://port-0-portiony-backend-md4272k5c4648749.sel5.cloudtype.app';
  const [dateSort, setDateSort] = useState('전체');
  const [chatRooms, setChatRooms] = useState([]); //안에 더미값 넣었었음
  const [myUserId, setMyUserId] = useState(null);

  const token = localStorage.getItem("accessToken");
  const client = useRef(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const selectedRoomRef = useRef(null); // ✅ 추가
  const subscribedRoomIdsRef = useRef(new Set());


useEffect(() => {
  const socket = new SockJS(`${BASE_URL}/ws-chat-sockjs`);
  client.current = new Client({
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log('✅ WebSocket connected');
      subscribeAllRooms(chatRooms);
    },
    onStompError: (frame) => {
      console.error('WebSocket error:', frame);
    },
  });


  client.current.activate();

  return () => {
    if (client.current) {
      client.current.deactivate();
    }
  };
}, []);

useEffect(() => {
  selectedRoomRef.current = selectedRoom;
}, [selectedRoom]);



//사용자 정보
useEffect(() => {
  const fetchMyUserInfo = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setMyUserId(data.userId);
    } catch (err) {
      console.error('사용자 정보 불러오기 실패:', err);
    }
  };

  fetchMyUserInfo();
}, []);

//채팅방 목록 조회
useEffect(() => {
  const fetchChatRooms = async () => {
    try {
      const type = getChatTypeParam(dateSort); 
      const response = await fetch(`${BASE_URL}/api/chats?type=${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // ← 요거
        },
      });
      const data = await response.json();

      const rooms = data.chatRoomsList.map((room) => ({
        id: room.chatRoomId,
        partnerName: room.partner.name,
        lastMessage: room.lastMessage || '',
        time: room.lastMessageTime
          ? new Date(room.lastMessageTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        title: room.post.title,
        price: room.post.price.toLocaleString(),
        ddayText: makeDdayText(room.post.deadline),
        postImage: room.post.imageUrl,
        profileImg: room.partner.profileImageUrl,
        isSeller: room.isSeller,
        isRead: room.isRead,
        lastSenderId: room.lastMessageSenderId,
        messages: [], // 나중에 실제 메시지 API로 채울 예정
      }));

      setChatRooms(rooms);
    } catch (err) {
      console.error('채팅방 불러오기 실패:', err);
    }
  };

  fetchChatRooms();
}, [dateSort]);


// 모든 채팅방 구독 처리 > 목록에서도 실시간 반영을 위함
useEffect(() => {
  if (!client.current || !client.current.connected) return;
subscribeAllRooms(chatRooms);

}, [myUserId, client.current?.connected, chatRooms]); // ✅ chatRooms 빠짐!!


const subscribeAllRooms = () => {
  if (!client.current?.connected) return;

  chatRooms.forEach((room) => {
    const subId = `chat-room-${room.id}`;

    // ✅ 이미 구독된 방은 무시
    if (subscribedRoomIdsRef.current.has(room.id)) return;

    console.log(`📡 구독 시도: ${subId}`);
    client.current.subscribe(
      `/sub/chat/room/${room.id}`,
      (message) => {
        const payload = JSON.parse(message.body);
        if (payload.senderId === myUserId) return;

        const newMsg = {
          content: payload.content,
          image: payload.imageUrls?.[0] || null,
          time: payload.createdAt,
          isMine: false,
          isSystem: payload.senderId === 0,
          systemType: payload.senderId === 0 ? payload.systemType : null,
        };

        // 채팅 목록 업데이트
        setChatRooms((prevRooms) =>
          prevRooms.map((r) =>
            r.id === room.id
              ? {
                  ...r,
                  lastMessage: payload.content,
                  time: new Date(payload.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isRead: selectedRoomRef.current?.id === r.id,
                  lastSenderId: payload.senderId,
                }
              : r
          )
        );

        // 현재 선택된 방일 경우 메시지도 추가
        if (selectedRoomRef.current?.id === room.id) {
          setSelectedRoom((prevRoom) => ({
            ...prevRoom,
            messages: [...prevRoom.messages, newMsg],
          }));
          setTimeout(scrollToBottom, 0);
        }
      },
      { id: subId }
    );

    // ✅ 구독 기록
    subscribedRoomIdsRef.current.add(room.id);
  });
};



const handleEnterRoom = async (room) => {
  try {
    // 메시지 불러오기
    const res = await fetch(`${BASE_URL}/api/chats/${room.id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json(); // data.messageList로 옴

    const formattedMessages = data.messageList.map((msg) => {
      const isSystem = msg.senderId === 0;
      return {
        content: msg.content,
        image: msg.imageUrls?.[0] || null,
        time: msg.createdAt,
        isMine: msg.senderId === myUserId,
        isSystem,
        systemType: isSystem ? 'completed' : null,
      };
    });

    const updatedRoom = {
      ...room,
      messages: formattedMessages,
    };

    // 읽음 처리 (내가 마지막 보낸 사람이 아닐 때만)
    if (room.lastSenderId && room.lastSenderId !== myUserId) {
      await fetch(`${BASE_URL}/api/chats/${room.id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedRooms = chatRooms.map((r) =>
        r.id === room.id ? { ...r, isRead: true } : r
      );

      setChatRooms(updatedRooms);
      setSelectedRoom({ ...updatedRoom, isRead: true });
    } else {
      setSelectedRoom(updatedRoom);
    }
  } catch (err) {
    console.error('채팅방 입장 또는 메시지 불러오기 실패:', err);
  }
};





  const filteredRooms = chatRooms.filter((room) => {
    if (!room.lastMessage && room.isSeller) return false;

      if (dateSort === '전체') return true;
      if (dateSort === '구매') return !room.isSeller; // 구매자일 때
      if (dateSort === '판매') return room.isSeller;  // 판매자일 때
      return true;
    });

    const isEmpty = filteredRooms.length === 0;

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  //채팅방 클릭했을 때 스크롤 하단으로 고정
  useEffect(() => {
    if (selectedRoom) {
      scrollToBottom();
    }
  }, [selectedRoom]);

  return (
    <div className={styles.container}>
      {/* 왼쪽: 채팅 목록 */}
      <div className={styles.leftWrapper}>
        <div className={styles.leftTop}>
          <h2 className={styles.chatTitle}>채팅 목록</h2>
          <Dropdown
            options={['전체','구매', '판매']}
            selected={dateSort}
            setSelected={setDateSort}
            placeholder="날짜"
          />
        </div>
        
        <div className={styles.left}>
          {isEmpty ? (
            <>
              <p className={styles.chatEmptyText}>
                💬 아직 시작된 채팅이 없습니다.<br /><br />
                이웃과 함께 나누는 첫 거래를 시작해보세요!
              </p>
              <p className={styles.chatEmptyText1}>
                공동구매 상품을 골라 시작할 수 있어요.
              </p>
              <button className={styles.button}>상품 둘러보기</button>
            </>
          ) : (
            filteredRooms.map((room) => (
              <ChatListItem
                key={room.id}
                partnerName={room.partnerName}
                lastMessage={room.lastMessage}
                lastMessageTime={room.time}
                postImage={room.postImage}
                profileImg={room.profileImg}
                hasUnread={room.lastMessage && !room.isRead && room.lastSenderId !== myUserId}
                onClick={() => handleEnterRoom(room)}
              />
            ))
          )}
        </div>
      </div>

      {/* 오른쪽: 채팅 상세 or 기본 박스 이미지 */}
      <div className={styles.right}>
        {selectedRoom ? (
          <div className={styles.chatDetail}>
      
          {/* ✅ 헤더 컴포넌트 추가 */}
          <ChatHeader
            partnerName={selectedRoom.partnerName}
            postImage={selectedRoom.postImage}
            title={selectedRoom.title}
            price={selectedRoom.price}
            ddayText={selectedRoom.ddayText}
          />

          <div className={styles.chatMessages} ref={chatContainerRef}>
            {Object.entries(groupMessagesByDate(selectedRoom.messages)).map(
              ([date, msgs]) => (
                <div key={date} className={styles.messageGroup}>
                  <div className={styles.dateLine}>{date}</div> {/* 스타일명 맞춤 */}
                  {msgs.map((msg, idx) => (
                    <ChatMessage
                      myName={myName}
                      key={idx}
                      content={msg.content}
                      image={msg.image}
                      time={new Date(msg.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      isMine={msg.isMine}
                      isSeller={selectedRoom.isSeller}
                      isSystem={msg.isSystem}
                      systemType={msg.systemType}
                    />
                  ))}
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>


      <ChatBottom
        myName={myName}
        isSeller={selectedRoom.isSeller} // TODO: 실제 로그인 유저 role로 바꿔줘!
        partnerName={selectedRoom.partnerName}
        completionCount={selectedRoom.completionCount}
        chatStatus={'active'} // TODO: 상태값에 따라 변경 가능
        onSendMessage={(newMessage) => {
          const payload =
            typeof newMessage === 'string'
              ? {
                  chatRoomId: selectedRoom.id,
                  senderId: myUserId,
                  content: newMessage,
                }
              : {
                  ...newMessage,
                  chatRoomId: selectedRoom.id,
                  senderId: myUserId,
                };

          // WebSocket 메시지 전송
          if (client.current && client.current.connected) {
            client.current.publish({
              destination: '/pub/chat/message',
              body: JSON.stringify(payload),
            });
          }

          const messageObj = {
      content: payload.content,
      image: payload.image || null,
      time: new Date().toISOString(),
      isMine: true,
      isSystem: false,
      systemType: null,
    };

    setSelectedRoom((prevRoom) => ({
      ...prevRoom,
      messages: [...prevRoom.messages, messageObj],
    }));

            // ✅ 2. 채팅 목록에 lastMessage 갱신
          setChatRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.id === selectedRoom.id
                ? {
                    ...room,
                    lastMessage: payload.content,
                    time: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  }
                : room
            )
          );

        setTimeout(scrollToBottom, 0);
      }}

      />
    </div>
  ) : (
    <img src={boxImage} alt="박스" className={styles.image} />
  )}
</div>

    </div>
  );
}

export default Chat;


function getFormattedDate(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

function groupMessagesByDate(messages) {
  const grouped = {};
  messages.forEach((msg) => {
    const dateKey = getFormattedDate(msg.time);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(msg);
  });
  return grouped;
}

       
function getChatTypeParam(dateSort) {
  if (dateSort === '전체') return 'all';
  if (dateSort === '구매') return 'buy';
  if (dateSort === '판매') return 'sell';
  return 'all';
}

function makeDdayText(deadline) {
  const today = new Date();
  const endDate = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return '공구마감';
  if (diff === 0) return '마감 D-DAY';
  return `마감 D-${diff}`;
}


