import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

const Portal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return <>{children}</>;
  return createPortal(children, modalRoot);
};

export default Portal;
