import Logout from '../../components/modal/scripts/Logout';
import Navbar from '../../components/navBar/Navbar';
import Sidebar from '../../components/sideBar/Sidebar';
import Transactions from '../../components/transactions/Transactions';
import './Home.css';
import { useEffect, useState } from 'react';
export default function Home() {
  const [closeModal, setCloseModal] = useState(false);

  function openLogoutModal() {
    setCloseModal((prev) => !prev);
  }
  useEffect(() => {
    document.title = 'Home';
  }, []);
  return (
    <div className="container-home">
      <Sidebar openLogoutModal={openLogoutModal}/>
      <div className="box-central">
        <Navbar />
        <div className="box-filter">
          <h2>Transactions</h2>
        </div>
        <Transactions />
        {closeModal && <Logout openLogoutModal={openLogoutModal} />}
      </div>
    </div>
  );
}
