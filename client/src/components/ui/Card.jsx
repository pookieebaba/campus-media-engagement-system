import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={['bg-stone rounded-2xl shadow-card p-6', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={['mb-4 pb-4 border-b border-border', className].join(' ')}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={['mt-4 pt-4 border-t border-border', className].join(' ')}>
      {children}
    </div>
  );
}

export default Card;
