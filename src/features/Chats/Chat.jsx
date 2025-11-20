import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import debounce from 'lodash.debounce';

import styles from './Chats.module.css';
import Dropdown from '../../components/DropDown/DropDown';
import api from '../../lib/axios';

import defaultProfile from '../../assets/LOGOMAIN.png';
import defaultProduct from '../../assets/profile-image.svg';

import sendIcon from '../../assets/send.svg';
import addIcon from '../../assets/add.svg';
import photoIcon from '../../assets/sendphoto.svg';
import promiseIcon from '../../assets/promise.svg';
import payIcon from '../../assets/requestpay.svg';
import addressIcon from '../../assets/sendinfo.svg';
import doneIcon from '../../assets/complete.svg';
import moreIcon from '../../assets/more_vert.svg';
import alarmWhite from '../../assets/alarmWhite.svg';
import backIcon from '../../assets/chevron-left.svg';

import DeliveryModal from '../../components/Chat/Modal/DeliveryModal';
import PromiseModal from '../../components/Chat/Modal/Promise';
import PayRequestModal from '../../components/Chat/Modal/PayRequest';
import DeliveryInfoModal from '../../components/Chat/Modal/DeliveryInfo';
import GroupBuyModal from '../../components/GroupBuy/GroupBuyModal';
import CompleteModal from '../../components/Chat/Modal/Complete';
import Complete2Modal from '../../components/Chat/Modal/Complete2';

const BASE_URL = 'https://port-0-portiony-be-md4272k5c4648749.sel5.cloudtype.app';


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
    if (!grouped[dateKey]) grouped[dateKey] = [];
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
    return timeB - timeA;
  });
}

const debouncedMarkAsRead = debounce(async (roomId) => {
  try {
    await api.patch(`/api/chats/${roomId}/read`);
  } catch (err) {
    console.error('실시간 읽음 처리 실패:', err);
  }
}, 500);


function Chat() {
  const navigate = useNavigate();
  const location = useLocation();

  const [myName, setMyName] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [dateSort, setDateSort] = useState('전체');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const clientRef = useRef(null);
  const selectedRoomRef = useRef(null);
  const subscribedRoomIdsRef = useRef(new Set());
  const hasEnteredRoomRef = useRef(false);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    const fetchMyUserInfo = async () => {
      try {
        const { data } = await api.get('/api/users/');
        setMyUserId(data.userId);
        setMyName(data.nickname);
      } catch (err) {
        console.error('사용자 정보 불러오기 실패:', err);
      }
    };
    fetchMyUserInfo();
  }, []);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const type = getChatTypeParam(dateSort);
        const { data } = await api.get('/api/chats', { params: { type } });

        const rooms = data.chatRoomsList.map((room) => {
          const sellerStatus = room.status?.sellerStatus;
          const buyerStatus = room.status?.buyerStatus;
          const isCompleted =
            sellerStatus === 'COMPLETED' && buyerStatus === 'COMPLETED';

          return {
            id: room.chatRoomId,
            partnerName: room.partner.name,
            lastMessage: room.lastMessage || '',
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

        setChatRooms(sortRoomsByLatestMessage(rooms));
      } catch (err) {
        console.error('채팅방 불러오기 실패:', err);
      }
    };

    fetchChatRooms();
  }, [dateSort]);

  useEffect(() => {
    const socket = new SockJS(`${BASE_URL}/ws-chat-sockjs`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      onConnect: () => {
        console.log('WebSocket connected');
        subscribeAllRooms(chatRooms, client);
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) clientRef.current.deactivate();
    };
  }, []);

  useEffect(() => {
    if (!clientRef.current || !clientRef.current.connected) return;
    subscribeAllRooms(chatRooms, clientRef.current);
  }, [chatRooms, myUserId]);

  useEffect(() => {
    if (!location.state?.chatRoomId || hasEnteredRoomRef.current) return;

    const roomId = location.state.chatRoomId;
    const targetRoom = chatRooms.find((room) => room.id === roomId);
    if (targetRoom) {
      handleEnterRoom(targetRoom);
      hasEnteredRoomRef.current = true;
      navigate('/chat', { replace: true });
    }
  }, [chatRooms, location.state, navigate]);

  const subscribeAllRooms = (rooms, client) => {
    if (!client?.connected) return;

    rooms.forEach((room) => {
      if (subscribedRoomIdsRef.current.has(room.id)) return;

      const subId = `chat-room-${room.id}`;
      console.log(`구독 시도: ${subId}`);

      client.subscribe(
        `/sub/chat/room/${room.id}`,
        async (message) => {
          const payload = JSON.parse(message.body);

          if (payload.senderId === myUserId) return;

          const isFinalCompleteMessage = payload.content?.includes(
            '🎉 소중한 거래가 최종 완료되었습니다!'
          );

          const newMsg = {
            content: payload.content,
            image: payload.imageUrls?.[0] || null,
            time: payload.createdAt,
            isMine: false,
            isSystem: payload.senderId === 0 || isFinalCompleteMessage,
            systemType: payload.senderId === 0 ? payload.systemType : null,
          };

          if (isFinalCompleteMessage) {
            api.get('/api/chats').then(({ data }) => {
              const updatedRoom = data.chatRoomsList.find(
                (r) => r.chatRoomId === room.id
              );
              if (!updatedRoom) return;

              const sellerStatus = updatedRoom.status?.sellerStatus;
              const buyerStatus = updatedRoom.status?.buyerStatus;
              const isTrulyCompleted =
                sellerStatus === 'COMPLETED' &&
                buyerStatus === 'COMPLETED';

              if (isTrulyCompleted) {
                if (selectedRoomRef.current?.id === room.id) {
                  setSelectedRoom((prev) => ({
                    ...prev,
                    sellerStatus,
                    buyerStatus,
                    isCompleted: true,
                  }));
                }
              }
            });
          }

          if (selectedRoomRef.current?.id === room.id) {
            debouncedMarkAsRead(room.id);

            setChatRooms((prevRooms) =>
              prevRooms.map((r) =>
                r.id === room.id ? { ...r, isRead: true } : r
              )
            );

            setSelectedRoom((prev) => ({
              ...prev,
              isRead: true,
            }));
          }

          setChatRooms((prevRooms) =>
            sortRoomsByLatestMessage(
              prevRooms.map((r) =>
                r.id === room.id
                  ? {
                      ...r,
                      lastMessage: payload.content,
                      time: new Date(payload.createdAt),
                      isRead: selectedRoomRef.current?.id === r.id,
                      lastSenderId: payload.senderId,
                    }
                  : r
              )
            )
          );

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

      subscribedRoomIdsRef.current.add(room.id);
    });
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleEnterRoom = async (room) => {
    try {
      const { data } = await api.get(`/api/chats/${room.id}/messages`);

      const sellerStatus = room.sellerStatus;
      const buyerStatus = room.buyerStatus;
      const isCompleted =
        sellerStatus === 'COMPLETED' && buyerStatus === 'COMPLETED';

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

      setTimeout(scrollToBottom, 0);
    } catch (err) {
      console.error('채팅방 입장 또는 메시지 불러오기 실패:', err);
    }
  };

  const handleBackToList = () => {
    setSelectedRoom(null);
    selectedRoomRef.current = null;
  };

  const handleCompleteTrade = async () => {
    if (!selectedRoom) return;

    try {
      const { data: result } = await api.patch(
        `/api/chats/${selectedRoom.id}/complete`
      );

      let count = 0;
      if (result.sellerStatus === 'COMPLETED') count += 1;
      if (result.buyerStatus === 'COMPLETED') count += 1;

      const isCompletedNow =
        result.sellerStatus === 'COMPLETED' &&
        result.buyerStatus === 'COMPLETED';

      setSelectedRoom((prev) => ({
        ...prev,
        sellerStatus: result.sellerStatus,
        buyerStatus: result.buyerStatus,
        isCompleted: isCompletedNow,
      }));

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
    if (dateSort === '구매') return !room.isSeller;
    if (dateSort === '판매') return room.isSeller;
    return true;
  });

  const isEmpty = filteredRooms.length === 0;

  return (
    <div className={styles.screen}>
      <div className={styles.phone}>

        {!selectedRoom ? (
          <>
            <div className={styles.appHeader}>
              <div>
                <h1 className={styles.appTitle}>채팅</h1>
                <p className={styles.appSubtitle}>
                  이웃과 주고받는 대화를 한눈에 확인해요.
                </p>
              </div>
              <Dropdown
                options={['전체', '구매', '판매']}
                selected={dateSort}
                setSelected={setDateSort}
                placeholder="전체"
              />
            </div>

            <div className={styles.chatListArea}>
              {isEmpty ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>
                    아직 시작된 채팅이 없어요.
                  </p>
                  <p className={styles.emptySub}>
                    이웃과의 첫 거래를 시작하면
                    <br />
                    이 화면에 채팅이 쌓여요.
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <ChatListRow
                    key={room.id}
                    room={room}
                    myUserId={myUserId}
                    onClick={() => handleEnterRoom(room)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <>

            <RoomHeader room={selectedRoom} onBack={handleBackToList} />

            <div className={styles.messageArea} ref={chatContainerRef}>
              {Object.entries(groupMessagesByDate(selectedRoom.messages)).map(
                ([date, msgs]) => (
                  <div key={date} className={styles.messageGroup}>
                    <div className={styles.dateLine}>{date}</div>
                    {msgs.map((msg, idx) => (
                      <MessageBubble key={idx} message={msg} />
                    ))}
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatBottom
              selectedRoom={selectedRoom}
              myUserId={myUserId}
              myName={myName}
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

                if (clientRef.current && clientRef.current.connected) {
                  clientRef.current.publish({
                    destination: '/pub/chat/message',
                    body: JSON.stringify(payload),
                  });
                }

                const messageObj = {
                  content: payload.content,
                  image: payload.image || null,
                  time: new Date().toISOString(),
                  isMine: true,
                  isSystem: !!payload.isSystem,
                  systemType: payload.systemType || null,
                };

                setSelectedRoom((prevRoom) => ({
                  ...prevRoom,
                  messages: [...prevRoom.messages, messageObj],
                }));

                setChatRooms((prevRooms) =>
                  sortRoomsByLatestMessage(
                    prevRooms.map((room) =>
                      room.id === selectedRoom.id
                        ? {
                            ...room,
                            lastMessage: payload.content,
                            time: new Date(),
                            isRead: true,
                          }
                        : room
                    )
                  )
                );

                setTimeout(scrollToBottom, 0);
              }}
              onCompleteTrade={handleCompleteTrade}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;

function DdayBadge({ text }) {
  const isClosing = text === '공구마감';
  return (
    <div
      className={`${styles.ddayBadge} ${
        isClosing ? styles.ddayClosing : ''
      }`}
    >
      {!isClosing && (
        <img
          src={alarmWhite}
          alt="알람 아이콘"
          className={styles.ddayIcon}
        />
      )}
      <span className={styles.ddayText}>{text}</span>
    </div>
  );
}

function ChatListRow({ room, myUserId, onClick }) {
  const {
    partnerName,
    lastMessage,
    time,
    postImage,
    profileImg,
    isRead,
    lastSenderId,
  } = room;

  const lastMessageTime =
    time instanceof Date
      ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : time
      ? new Date(time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

  const hasUnread = lastMessage && !isRead && lastSenderId !== myUserId;

  const rawPreview = lastMessage || '';
  const firstLine = rawPreview.split('\n')[0];
  const MAX_LEN = 32; 

  const previewText =
    firstLine.length > MAX_LEN
      ? `${firstLine.slice(0, MAX_LEN)}...`
      : firstLine;

  return (
    <button type="button" className={styles.listRow} onClick={onClick}>
      <div className={styles.listImageWrap}>
        <img
          src={postImage || defaultProduct}
          alt="게시글 이미지"
          className={styles.listPostImg}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultProduct;
          }}
        />
        <img
          src={profileImg || defaultProfile}
          alt="프로필"
          className={styles.listProfileImg}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultProfile;
          }}
        />
      </div>

      <div className={styles.listContent}>
        <div className={styles.listTop}>
          <span className={styles.listName}>{partnerName}</span>
          <span className={styles.listTime}>{lastMessageTime}</span>
        </div>
        <div className={styles.listBottom}>
          <p className={styles.listLastMsg}>{previewText}</p>
          {hasUnread && <span className={styles.unreadDot} />}
        </div>
      </div>
    </button>
  );
}

function RoomHeader({ room, onBack }) {
  const navigate = useNavigate();
  const { partnerName, postId, postImage, title, price, ddayText } = room;

  const handleClickPost = () => {
    if (!postId) return;
    navigate(`/group-buy/${postId}`);
  };

  return (
    <>
      <div className={styles.roomAppBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <img src={backIcon} alt="뒤로" />
        </button>
        <span className={styles.roomTitle}>{partnerName}</span>
        <button type="button" className={styles.moreBtn}>
          <img src={moreIcon} alt="더보기" />
        </button>
      </div>

      <button
        type="button"
        className={styles.roomPostCard}
        onClick={handleClickPost}
      >
        <img
          src={postImage || defaultProduct}
          alt="상품"
          className={styles.roomPostImg}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultProduct;
          }}
        />
        <div className={styles.roomPostText}>
          <div className={styles.roomPostTitle}>
            {title.length > 34 ? `${title.slice(0, 36)}...` : title}
          </div>
          <div className={styles.roomPostPrice}>{price}원</div>
        </div>
        <DdayBadge text={ddayText} />
      </button>
    </>
  );
}

function MessageBubble({ message }) {
  const { content, image, time, isMine, isSystem, systemType } = message;

  const bubbleClass = isMine ? styles.myBubble : styles.theirBubble;
  const rowClass = isMine ? styles.rowReverse : styles.row;

  const systemClass = isSystem
    ? ({
        promise: styles.promiseBubble,
        pay: styles.payBubble,
        address: styles.addressBubble,
        delivery: styles.deliveryBubble,
        completed: styles.completedBubble,
      }[systemType] || styles.systemBubble)
    : '';

  const displayTime = new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={styles.messageWrapper}
      style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}
    >
      <div className={`${styles.messageRow} ${rowClass}`}>
        <div className={`${bubbleClass} ${isSystem ? systemClass : ''}`}>
          {content && (
            <p className={styles.bubbleText}>
              {content.split('\n').map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          )}
          {image && (
            <img src={image} alt="보낸 이미지" className={styles.bubbleImage} />
          )}
        </div>
        <span className={styles.bubbleTime}>{displayTime}</span>
      </div>
    </div>
  );
}


function ChatBottom({
  selectedRoom,
  myUserId,
  myName,
  onSendMessage,
  onCompleteTrade,
}) {
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [showPayRequestModal, setShowPayRequestModal] = useState(false);
  const [showDeliveryInfoModal, setShowDeliveryInfoModal] = useState(false);
  const [showGroupBuyModal, setShowGroupBuyModal] = useState(false);
  const [lastOpenedModal, setLastOpenedModal] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showComplete2Modal, setShowComplete2Modal] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const [promiseData, setPromiseData] = useState({
    date: '',
    time: '',
    location: '',
  });

  const [payData, setPayData] = useState({
    accountHolder: '',
    phoneNumber: '',
    accountNumber: '',
    amount: '',
  });

  const [addressData, setAddressData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [deliveryData, setDeliveryData] = useState({
    courier: '',
    tracking: '',
  });

  const isSeller = selectedRoom?.isSeller;
  const partnerName = selectedRoom?.partnerName;
  const isCompleted = selectedRoom?.isCompleted;

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  return (
    <>
      <div className={styles.bottomArea}>
        {showOptions && (
          <div className={styles.optionRow}>

            <button type="button" className={styles.optionBtn}>
              <div className={styles.optionIconWrap}>
                <img src={photoIcon} alt="사진 전송" />
              </div>
              <span>사진 전송</span>
            </button>

            {isSeller && (
              <>
                <button
                  type="button"
                  className={styles.optionBtn}
                  onClick={() => setShowPromiseModal(true)}
                  disabled={isCompleted}
                >
                  <div className={styles.optionIconWrap}>
                    <img src={promiseIcon} alt="약속 잡기" />
                  </div>
                  <span>약속 잡기</span>
                </button>

                <button
                  type="button"
                  className={styles.optionBtn}
                  onClick={() => setShowPayRequestModal(true)}
                  disabled={isCompleted}
                >
                  <div className={styles.optionIconWrap}>
                    <img src={payIcon} alt="송금 요청" />
                  </div>
                  <span>송금 요청</span>
                </button>
              </>
            )}

            <button
              type="button"
              className={styles.optionBtn}
              onClick={() => {
                if (!isSeller) setShowAddressModal(true);
                else setShowDeliveryInfoModal(true);
              }}
              disabled={isCompleted}
            >
              <div className={styles.optionIconWrap}>
                <img src={addressIcon} alt="배송" />
              </div>
              <span>{isSeller ? '배송 정보 전송' : '배송지 전송'}</span>
            </button>

            <button
              type="button"
              className={styles.optionBtn}
              onClick={() => setShowCompleteModal(true)}
              disabled={isCompleted}
            >
              <div className={styles.optionIconWrap}>
                <img src={doneIcon} alt="거래완료" />
              </div>
              <span>거래 완료</span>
            </button>
          </div>
        )}

        <div className={styles.inputRow}>
          <button
            type="button"
            className={styles.plusBtn}
            onClick={toggleOptions}
          >
            <img src={addIcon} alt="plus" />
          </button>

          <textarea
            className={styles.input}
            placeholder="메시지를 입력하세요."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
          />

          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
          >
            <img src={sendIcon} alt="send" />
          </button>
        </div>
      </div>

      {showAddressModal && (
        <DeliveryModal
          onClose={() => setShowAddressModal(false)}
          onNext={() => {
            setShowAddressModal(false);
            setLastOpenedModal('address');
            setShowGroupBuyModal(true);
          }}
          data={addressData}
          setData={setAddressData}
        />
      )}

      {showPromiseModal && (
        <PromiseModal
          onClose={() => setShowPromiseModal(false)}
          onSubmit={() => {
            setShowPromiseModal(false);
            setLastOpenedModal('promise');
            setShowGroupBuyModal(true);
          }}
          data={promiseData}
          setData={setPromiseData}
        />
      )}

      {showPayRequestModal && (
        <PayRequestModal
          onClose={() => setShowPayRequestModal(false)}
          onSubmit={() => {
            setShowPayRequestModal(false);
            setLastOpenedModal('pay');
            setShowGroupBuyModal(true);
          }}
          data={payData}
          setData={setPayData}
        />
      )}

      {showDeliveryInfoModal && (
        <DeliveryInfoModal
          onClose={() => setShowDeliveryInfoModal(false)}
          onNext={() => {
            setShowDeliveryInfoModal(false);
            setLastOpenedModal('delivery');
            setShowGroupBuyModal(true);
          }}
          data={deliveryData}
          setData={setDeliveryData}
        />
      )}

      {showGroupBuyModal && (
        <GroupBuyModal
          message="작성 내용을 전송하시겠어요?"
          confirmText="보내기"
          cancelText="취소"
          onConfirm={() => {
            setShowGroupBuyModal(false);

            let systemMessage = '';
            let systemType = '';

            switch (lastOpenedModal) {
              case 'promise':
                systemMessage = `📍 ${partnerName}님과의 직거래 약속\n날짜 : ${promiseData.date}\n시간 : ${promiseData.time}\n장소 : ${promiseData.location}`;
                systemType = 'promise';
                break;
              case 'pay':
                systemMessage = `💸 송금 요청이 도착했어요!\n예금주: ${payData.accountHolder}\n은행명: ${payData.phoneNumber}\n계좌번호: ${payData.accountNumber}\n금액: ${payData.amount}`;
                systemType = 'pay';
                break;
              case 'address':
                systemMessage = `🚚 배송지 입력이 완료되었습니다!\n수령인: ${addressData.name}\n전화번호: ${addressData.phone}\n배송지: ${addressData.address}\n${partnerName}님은 '+'버튼을 통해 배송 접수 정보를 알려주세요!`;
                systemType = 'address';
                break;
              case 'delivery':
                systemMessage = `🚚 배송 접수가 완료되었습니다!\n택배사: ${deliveryData.courier}\n운송장 번호: ${deliveryData.tracking}\n${partnerName}님은 택배를 수령하신 후, '+'버튼을 통해 거래를 완료해주세요!`;
                systemType = 'delivery';
                break;
              default:
                return;
            }

            onSendMessage({
              content: systemMessage,
              isMine: true,
              isSystem: true,
              systemType,
            });
          }}
          onCancel={() => {
            setShowGroupBuyModal(false);
            if (lastOpenedModal === 'promise') setShowPromiseModal(true);
            else if (lastOpenedModal === 'pay') setShowPayRequestModal(true);
            else if (lastOpenedModal === 'address') setShowAddressModal(true);
            else if (lastOpenedModal === 'delivery')
              setShowDeliveryInfoModal(true);
          }}
        />
      )}

      {showCompleteModal && (
        <CompleteModal
          onCancel={() => setShowCompleteModal(false)}
          onConfirm={async () => {
            setShowCompleteModal(false);
            setShowComplete2Modal(true);

            const count = await onCompleteTrade();

            let systemMessage = '';
            if (count === 1) {
              systemMessage =
                '🎉 거래가 완료되었어요!\n판매자/구매자님 모두 [거래완료] 버튼을 눌러주셔야 거래가 ‘최종 완료’됩니다.';
            } else if (count === 2) {
              systemMessage =
                '🎉 소중한 거래가 최종 완료되었습니다!\n후기는 마이페이지에서 작성가능합니다 :)\n포셔니와 함께 해주셔서 감사합니다.';
            }

            onSendMessage({
              content: systemMessage,
              isMine: true,
              isSystem: true,
              systemType: 'completed',
            });
          }}
        />
      )}

      {showComplete2Modal && (
        <Complete2Modal
          onClose={() => setShowComplete2Modal(false)}
          onReview={() => {
            setShowComplete2Modal(false);
          }}
          onHome={() => {
            setShowComplete2Modal(false);
          }}
        />
      )}
    </>
  );
}
