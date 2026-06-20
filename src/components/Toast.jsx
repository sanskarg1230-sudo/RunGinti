import { useEffect, useState } from 'react';

let toastFn = null;

export function showToast(message, duration = 2500) {
  if (toastFn) toastFn(message, duration);
}

export default function Toast() {
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    toastFn = (message, duration) => {
      setToast({ show: true, message });
      setTimeout(() => setToast({ show: false, message: '' }), duration);
    };
    return () => { toastFn = null; };
  }, []);

  return (
    <div className={`toast ${toast.show ? 'show' : ''}`}>
      {toast.message}
    </div>
  );
}
