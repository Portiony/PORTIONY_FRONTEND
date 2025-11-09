import React, { useState } from "react";
import HomeBody from "../../components/Home/HomeBody";
import LocationModal from "../../components/Home/LocationModal";

function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("전국");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSelectDong = (location, locationId) => {
    setSelectedAddress(location);
    setSelectedAddressId(locationId);
    setIsModalOpen(false);
  };

  return (
    <>
      <HomeBody
        onOpenLocation={() => setIsModalOpen(true)}
        selectedAddress={selectedAddress}
        selectedAddressId={selectedAddressId}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
      />
      <LocationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAddress={handleSelectDong}
      />
    </>
  );
}

export default Home;
