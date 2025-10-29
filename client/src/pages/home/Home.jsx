
import Logout from '../../components/modal/scripts/Logout';
import Navbar from '../../components/navBar/Navbar';
import { useState } from 'react';
import Transactions from '../../components/transactions/Transactions';
import Sidebar from '../../components/sideBar/Sidebar';
export default function Home() {
  const [closeModal, setCloseModal] = useState(false);

  function openLogoutModal() {
    setCloseModal((prev) => !prev);
  }
  return (
    <div className="container-home">
      <div>
        <Sidebar openLogoutModal={openLogoutModal} />
      </div>
      <div className="box-central">
        <div>
          <Navbar />
          <Transactions />
        </div>
      </div>
      {closeModal && <Logout openLogoutModal={openLogoutModal} />}
    </div>
  );
}
