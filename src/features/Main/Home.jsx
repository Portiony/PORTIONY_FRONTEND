import React,{useState} from 'react';
import HomeHeader from '../../components/Home/HomeHeader';
import HomeBody from '../../components/Home/HomeBody';
import LocationModal from '../../components/Home/LocationModal';

function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('서울특별시 중랑구 망우본동');
    const [selectedAddressId, setSelectedAddressId] = useState(21894);
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [searchKeyword, setSearchKeyword] = useState('');

    const handleSelectDong = (location, locationId) => {
        setSelectedAddress(location);
        setSelectedAddressId(locationId);
        setIsModalOpen(false);
    };

    return (
        <div>
            <HomeHeader
                onLocationClick={() => setIsModalOpen(true)}
                selectedAddress={selectedAddress}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                searchKeyword={searchKeyword}
                onSearchKeywordChange={setSearchKeyword}
            />
            <HomeBody
                selectedAddressId={selectedAddressId}
                selectedAddress={selectedAddress}
                selectedCategory={selectedCategory}
                searchKeyword={searchKeyword}
            />
            <LocationModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelectAddress={handleSelectDong}
            />
        </div>
    );
}

export default Home;
