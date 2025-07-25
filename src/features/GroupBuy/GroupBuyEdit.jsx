import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GroupBuyNew from './GroupBuyNew';
import axios from '../../lib/axios';

function GroupBuyEdit() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const res = await axios.get(`/api/posts/${id}`);
        setInitialData(res.data.post);
      } catch (err) {
        console.error("게시글 불러오기 실패", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [id]);

  if (loading) return <div>로딩중...</div>;
  if (!initialData) return <div>데이터를 불러올 수 없습니다.</div>;

  return (
    <GroupBuyNew
      mode="edit"
      productId={id}
      initialData={initialData}
    />
  );
}

export default GroupBuyEdit;
