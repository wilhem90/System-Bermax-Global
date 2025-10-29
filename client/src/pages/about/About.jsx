import Logout from '../../components/modal/scripts/Logout';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/sideBar/Sidebar';
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
      <Sidebar openLogoutModal={openLogoutModal} />
      <div className="box-central">
        {closeModal && <Logout openLogoutModal={openLogoutModal} />}
      </div>
    </div>
  );
}
