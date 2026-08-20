import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'iceberg-card p-5',
        hoverable && 'iceberg-card-hover cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
