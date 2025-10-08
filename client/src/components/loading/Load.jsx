import './Load.css';
export default function Load({ message }) {
  return (
    <div className="box-loading">
      <div className="spinner" />
      <span style={{ color: 'white', marginTop: '10px' }}>{message}</span>
    </div>
  );
}
