import { useState } from 'react';
import Logout from '../../components/modal/scripts/Logout';
import FormTopup from '../../components/modal/scripts/FormTopup';
import Sidebar from '../../components/sideBar/Sidebar';
export default function Home() {
  const [closeModal, setCloseModal] = useState(false);

  function openLogoutModal() {
    setCloseModal((prev) => !prev);
  }
  return (
    <div className="container-home">
      <Sidebar openLogoutModal={openLogoutModal} />
      <div className="box-central">
        <FormTopup />
        {closeModal && <Logout openLogoutModal={openLogoutModal} />}
      </div>
    </div>
  );
}
