import Logout from '../../components/modal/scripts/Logout';
import { useState } from 'react';
import FormTransfer from '../../components/modal/scripts/FormTransfer';
import Sidebar from '../../components/sideBar/Sidebar';
export default function TransferMoney() {
  const [closeModal, setCloseModal] = useState(false);

  function openLogoutModal() {
    setCloseModal((prev) => !prev);
  }
  return (
    <div className="container-home">
      <Sidebar openLogoutModal={openLogoutModal}/>
      <div className="box-central">
        <FormTransfer />
        {closeModal && <Logout openLogoutModal={openLogoutModal} />}
      </div>
    </div>
  );
}
