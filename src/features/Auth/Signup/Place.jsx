import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Place() {
  const [searchParams] = useSearchParams();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  return (
    <div>
      <h1>위치 확인</h1>
      <p>위도: {lat}</p>
      <p>경도: {lng}</p>
    </div>
  );
}
