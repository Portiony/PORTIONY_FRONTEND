import instance from '../lib/axios';

export async function fetchPosts(params) {
    const searchParams = new URLSearchParams();

    // URLSearchParams에 params 객체의 키-값 쌍을 추가
    // append로 파라미터 추가시 자동으로 URL 인코딩 처리됨
    // 값이 undefined, null, 빈 문자열인 경우는 제외
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });
    
    // URLSearchParams를 문자열로 변환하여 GET 요청에 사용
    const queryString = searchParams.toString();
    // GET 요청을 보내고 응답 데이터를 반환
    const response = await instance.get(`/api/post/recommend?${queryString}`);
    console.log('AI Posts:', response.data);
    return response.data;
}

export async function searchLocations(keyword){
    const response = await instance.get(`/api/location/search?keyword=${keyword}`);
    return response.data;
}