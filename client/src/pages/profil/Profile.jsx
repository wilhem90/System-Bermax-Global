import { useState } from 'react';

export default function Profile() {
  const [avatarProfil, setAvatarProfil] = useState(null);

  function uploadphoto() {
    const form = new FormData();
    form.append('avatarProfil', avatarProfil);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type':
          'multipart/form-data; boundary=---011000010111000001101001',
      },
    };

    options.body = form;
    fetch('http://localhost:3000/upload', options)
      .then((response) => response.json())
      .then((response) => console.log(response))
      .catch((err) => console.error(err));
  }
  console.log(avatarProfil);
  return (
    <div className="container-profil">
      <h2>Profile</h2>
      <input
        type="file"
        name="avtarProfil"
        id="avatarProfil"
        onChange={(e) => setAvatarProfil(e.target.value)}
      />

      <button onClick={uploadphoto}>Upload foto</button>
    </div>
  );
}
