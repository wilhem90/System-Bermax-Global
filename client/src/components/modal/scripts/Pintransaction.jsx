import { useState, useRef, useEffect } from 'react';
import '../styles/Pintransaction.css';
import { Lock } from 'lucide-react';

const MAX_PIN_LENGTH = 4;

export default function Pintransaction({ onClose, onConfirm, message }) {
  const [pins, setPins] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    const { key } = e;

    if (/^\d$/.test(key) && pins.length < MAX_PIN_LENGTH) {
      setPins([...pins, key]);
    } else if (key === 'Backspace') {
      setPins(pins.slice(0, -1));
    }
  };

  useEffect(() => {
    console.log(pins);
    if (pins.length === MAX_PIN_LENGTH) {
      onConfirm(pins.join(''));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return (
    <div
      className="pin-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="pin-modal">
        <h2>{message}</h2>
        <div className="pin-icon">
          <Lock size={60} />
        </div>
        <p>Insira seu PIN para confirmar</p>

        <div className="pin-box">
          {[...Array(MAX_PIN_LENGTH)].map((_, i) => (
            <div key={i} className={`pin-digit ${pins[i] ? 'filled' : ''}`}>
              {pins[i] ? '•' : ''}
            </div>
          ))}
        </div>

        <input
          type="tel"
          ref={inputRef}
          maxLength={MAX_PIN_LENGTH}
          style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
        />

        <div className="pin-actions">
          <button className="btn-back" onClick={onClose}>
            Voltar
          </button>
          <button
            className="btn-confirm"
            disabled={pins.length < MAX_PIN_LENGTH}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
