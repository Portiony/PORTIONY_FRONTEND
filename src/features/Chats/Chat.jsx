import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import boxImage from '../../assets/chat_logo.png';
import styles from './Chats.module.css';
import Dropdown from '../../components/DropDown/DropDown';
import ChatListItem from '../../components/Chat/ChatListItem/ChatListItem';
import ChatHeader from '../../components/Chat/ChatHeader/ChatHeader';
import ChatBottom from '../../components/Chat/ChatBottom/ChatBottom';
import ChatMessage from '../../components/Chat/ChatMessage/ChatMessage';
import api from '../../lib/axios';

import profileImg from '../../assets/profile.png';
import postImage from '../../assets/product.png'; //상품 이미지
import defaultProfile from '../../assets/LOGOMAIN.png';
import defaultProduct from '../../assets/profile-image.svg';


function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const BASE_URL = 'https://port-0-portiony-backend-md4272k5c4648749.sel5.cloudtype.app';
  const [dateSort, setDateSort] = useState('전체');
  const [chatRooms, setChatRooms] = useState([]); //안에 더미값 넣었었음
  const [myUserId, setMyUserId] = useState(null);

  //const token = localStorage.getItem("accessToken");
  const client = useRef(null); //stomp 클라이언트(stompjs)
  const [selectedRoom, setSelectedRoom] = useState(null); //현재 클릭된 채팅방
  const selectedRoomRef = useRef(null); //선택된 채팅방 ref
  const subscribedRoomIdsRef = useRef(new Set()); //중복 구독 방지용

  //웹 소켓 연결 및 구독
  useEffect(() => {
    const socket = new SockJS(`${BASE_URL}/ws-chat-sockjs`);
    client.current = new Client({
      webSocketFactory: () => socket,
      onConnect: () => { //웹 소켓 연결 후 모든 채팅방을 구독한다
        console.log('✅ WebSocket connected');
        subscribeAllRooms(chatRooms);
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
      },
    });

    client.current.activate(); //소켓 연결 시작

    return () => {
      if (client.current) {
        client.current.deactivate(); //페이지 나갈 때 소켓 종료
      }
    };
  }, []);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom; //현재 선택된 방 추적용, 최신값을 항상 유지함
    console.log(selectedRoomRef.current);
  }, [selectedRoom]);

  //사용자 정보 불러옴
  useEffect(() => {
    const fetchMyUserInfo = async () => {
      try {
        const { data } = await api.get('/api/users/');
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
        const { data } = await api.get('/api/chats', {
          params: { type }
        });
        const rooms = data.chatRoomsList.map((room) => {
          const sellerStatus = room.status?.sellerStatus;
          const buyerStatus = room.status?.buyerStatus;
          const isCompleted = sellerStatus === 'COMPLETED' && buyerStatus === 'COMPLETED';
          
          return {
          id: room.chatRoomId,
          partnerName: room.partner.name,
          lastMessage: room.lastMessage || '',
          // time: room.lastMessageTime
          //   ? new Date(room.lastMessageTime).toLocaleTimeString([], {
          //       hour: '2-digit',
          //       minute: '2-digit',
          //     })
          //   : '',
          time: room.lastMessageTime ? new Date(room.lastMessageTime) : null,
          title: room.post.title,
          price: room.post.price.toLocaleString(),
          ddayText: makeDdayText(room.post.deadline),
          postId: room.post.postId,
          postImage: room.post.imageUrl || defaultProduct,
          profileImg: room.partner.profileImageUrl || defaultProfile,
          isSeller: room.isSeller,
          isRead: room.isRead,
          lastSenderId: room.lastMessageSenderId,
          messages: [],
          sellerStatus,
          buyerStatus,
          isCompleted,
          };
        });

        //setChatRooms(rooms);
        setChatRooms(sortRoomsByLatestMessage(rooms));
      } catch (err) {
        console.error('채팅방 불러오기 실패:', err);
      }
    };
    fetchChatRooms();
  }, [dateSort]);


  // 모든 채팅방 구독 처리 > 목록에서 수신 메시지 실시간 반영을 위함
  useEffect(() => {
    if (!client.current || !client.current.connected) return; //웹소켓 연결 x
    subscribeAllRooms(chatRooms);

  }, [myUserId, client.current?.connected, chatRooms]); //myuserid 바뀔 때, 웹 소켓 연결 성공했을 때, chatroom 데이터가 바뀌었을 때 해당 useeffect 실행

  // 모든 채팅방 구독 처리
  const subscribeAllRooms = () => {
    if (!client.current?.connected) return;

    chatRooms.forEach((room) => { //보유하고 있는 chatroom 리스트를 순회 각 방을 하나씩 구독 처리
      const subId = `chat-room-${room.id}`;

      // 이미 구독된 방은 무시
      if (subscribedRoomIdsRef.current.has(room.id)) return;

      console.log(`구독 시도: ${subId}`);

      //구독 로직
      client.current.subscribe(
        `/sub/chat/room/${room.id}`,
        (message) => {
          const payload = JSON.parse(message.body);
          if (payload.senderId === myUserId) return; //내가 보낸 메시지 무시 > 이미 렌더링 처리
          const isFinalCompleteMessage = payload.content?.includes('🎉 소중한 거래가 최종 완료되었습니다!\n후기는 마이페이지에서 작성가능합니다 :)\n포셔니와 함께 해주셔서 감사합니다.');
          const newMsg = {
            content: payload.content,
            image: payload.imageUrls?.[0] || null,
            time: payload.createdAt,
            isMine: false,
            isSystem: isFinalCompleteMessage,
            systemType: payload.senderId === 0 ? payload.systemType : null,
          };

          if (isFinalCompleteMessage) {
            api.get('/api/chats').then(({ data }) => {
              const updatedRoom = data.chatRoomsList.find((r) => r.chatRoomId === room.id);
              if (!updatedRoom) return;

              const sellerStatus = updatedRoom.status?.sellerStatus;
              const buyerStatus = updatedRoom.status?.buyerStatus;
              const isTrulyCompleted = sellerStatus === 'COMPLETED' && buyerStatus === 'COMPLETED';

              if (isTrulyCompleted) {
                if (selectedRoomRef.current?.id === room.id) {
                  setSelectedRoom((prev) => ({
                    ...prev,
                    sellerStatus,
                    buyerStatus,
                    isCompleted: true, // ✅ 이걸 강제로 다시 넣어줘야 버튼 반응
                  }));
                }
              }
            });
          }



          // 채팅 목록 업데이트
          setChatRooms((prevRooms) =>
            sortRoomsByLatestMessage(
            prevRooms.map((r) =>
              r.id === room.id
                ? {
                    ...r,
                    lastMessage: payload.content,
                    // time: new Date(payload.createdAt).toLocaleTimeString([], {
                    //   hour: '2-digit',
                    //   minute: '2-digit',
                    // }),
                    time: new Date(payload.createdAt),
                    isRead: selectedRoomRef.current?.id === r.id,
                    lastSenderId: payload.senderId,
                  }
                : r
                )
            )
          );

          // 현재 선택된 방일 경우 메시지도 추가
          if (selectedRoomRef.current?.id === room.id) {
            setSelectedRoom((prevRoom) => ({
              ...prevRoom,
              messages: [...prevRoom.messages, newMsg], //내 메시지는 보내자마자 바로 렌더링 되므로 위에서 내가 보낸 메시지 무시 처리
            }));
            setTimeout(scrollToBottom, 0);
          }
        },
        { id: subId }
      );

      // 구독 완료 표시
      subscribedRoomIdsRef.current.add(room.id);
    });
};


//채팅방 클릭 시 호출
const handleEnterRoom = async (room) => {
  try {
    // 메시지 불러오기
    const { data } = await api.get(`/api/chats/${room.id}/messages`);

    const sellerStatus = room.sellerStatus;
    const buyerStatus = room.buyerStatus;
    const isCompleted = sellerStatus === 'COMPLETED' && buyerStatus === 'COMPLETED';

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
      isCompleted,
    };

    // 읽음 처리 (내가 마지막 보낸 사람이 아닐 때만)
    if (room.lastSenderId && room.lastSenderId !== myUserId) {
      await api.patch(`/api/chats/${room.id}/read`);

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

//거래완료
const handleCompleteTrade = async () => {
  if (!selectedRoom) return;

  try {
    const { data: result } = await api.patch(`/api/chats/${selectedRoom.id}/complete`);


    // count 계산 > 거래 완료 여부에 따름
    let count = 0;
    if (result.sellerStatus === 'COMPLETED') count += 1;
    if (result.buyerStatus === 'COMPLETED') count += 1;

    const isCompletedNow = result.sellerStatus === 'COMPLETED' && result.buyerStatus === 'COMPLETED';

    //  selectedRoom 즉시 반영 (=> ChatBottom이 즉시 반응)
    setSelectedRoom((prev) => ({
      ...prev,
      sellerStatus: result.sellerStatus,
      buyerStatus: result.buyerStatus,
      isCompleted: isCompletedNow,
    }));

    // chatRooms 안에서도 상태 반영
    setChatRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === selectedRoom.id
          ? {
              ...room,
              sellerStatus: result.sellerStatus,
              buyerStatus: result.buyerStatus,
              isCompleted: isCompletedNow,
            }
          : room
      )
    );

    // 상태 반영
    // setSelectedRoom((prev) => ({
    //   ...prev,
    //   completionCount: count,
    // }));

    // setChatRooms((prev) =>
    //   prev.map((room) =>
    //     room.id === selectedRoom.id
    //       ? { ...room, completionCount: count }
    //       : room
    //   )
    // );
    console.log(`거래 완료 상태 업데이트 완료: ${count}`);
    return count;
  } catch (err) {
    console.error(' 거래 완료 실패:', err);
    alert('거래 완료 중 문제가 발생했습니다.');
    return 0;
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
              <button className={styles.button} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>상품 둘러보기</button>
            </>
          ) : (
            filteredRooms.map((room) => (
              <ChatListItem
                key={room.id}
                partnerName={room.partnerName}
                lastMessage={room.lastMessage}
                // lastMessageTime={room.time}
                lastMessageTime={
                room.time instanceof Date
                  ? room.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : room.time
                    ? new Date(room.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''
              }

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
            postId = {selectedRoom.postId}
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
        isSeller={selectedRoom.isSeller}
        partnerName={selectedRoom.partnerName}
        onCompleteTrade={handleCompleteTrade}
        chatStatus={'active'}
        isCompleted={selectedRoom.isCompleted}
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
            sortRoomsByLatestMessage(
            prevRooms.map((room) =>
              room.id === selectedRoom.id
                ? {
                    ...room,
                    lastMessage: payload.content,
                    // time: new Date().toLocaleTimeString([], {
                    //   hour: '2-digit',
                    //   minute: '2-digit',
                    // }),
                    time: new Date(),
                  }
                : room
            )
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

function sortRoomsByLatestMessage(rooms) {
  return [...rooms].sort((a, b) => {
    const timeA = new Date(a.time || 0).getTime();
    const timeB = new Date(b.time || 0).getTime();
    return timeB - timeA; // 최신순 정렬
  });
}