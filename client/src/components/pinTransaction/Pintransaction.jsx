import { useState, useRef, useEffect } from 'react';
import './Pintransaction.css';

const MAX_PIN_LENGTH = 4;

export default function Pintransaction({ onclose, valuePins }) {
  const [pins, setPins] = useState([]);
  const [focused, setFocused] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Foca automaticamente ao montar
  useEffect(() => {
    boxRef.current?.focus();
    inputRef.current?.focus(); // foca o input oculto também
  }, []);

  // Piscar do cursor
  useEffect(() => {
    const intervalId = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  function handleKeyDown(e) {
    const { key } = e;

    if (/^\d$/.test(key)) {
      if (pins.length < MAX_PIN_LENGTH) {
        const newPins = [...pins, key];
        setPins(newPins);
        valuePins(newPins.join(''));
      }
    }

    if (key === 'Backspace') {
      const newPins = pins.slice(0, -1);
      setPins(newPins);
      valuePins(newPins.join(''));
    }
  }

  function handleFocus() {
    setFocused(true);
    inputRef.current?.focus();
  }

  function handleBlur() {
    setFocused(false);
  }

  return (
    <div
      className={`box-pin ${focused ? 'focused' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={boxRef}
      aria-label="Digite seu PIN de 4 dígitos"
    >
      <div className="body-modal" onClick={() => inputRef.current?.focus()}>
        {[...Array(MAX_PIN_LENGTH)].map((_, i) => (
          <span className="digit-value" key={i}>
            {pins.length === i && pins.length < MAX_PIN_LENGTH ? (
              <span className="cursor">{showCursor ? '|' : ' '}</span>
            ) : pins.length > i ? (
              <span className="digit-filled">*</span>
            ) : (
              ''
            )}
          </span>
        ))}

        {/* Input oculto para teclado numérico em mobile */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="\d*"
          maxLength={MAX_PIN_LENGTH}
          autoComplete="off"
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            height: 0,
            width: 0,
          }}
          ref={inputRef}
        />
      </div>
      <div className="modal-header">
        <button className="close-button" onClick={onclose} aria-label="Fechar">
          ×
        </button>
      </div>
    </div>
  );
}
