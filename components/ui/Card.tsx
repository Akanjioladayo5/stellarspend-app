import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg border-0',
};

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const childArray = React.Children.toArray(children);
  const hasHeader = childArray.some(child => React.isValidElement(child) && child.type === CardHeader);
  const hasFooter = childArray.some(child => React.isValidElement(child) && child.type === CardFooter);

  return (
    <div className={`rounded-lg ${variantStyles[variant]} ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === CardHeader) {
            return React.cloneElement(child as React.ReactElement<CardHeaderProps>, {
              noBorder: !hasFooter && childArray[childArray.length - 1] === child
            });
          }
          if (child.type === CardFooter) {
            return React.cloneElement(child as React.ReactElement<CardFooterProps>, {
              noBorder: !hasHeader && childArray[0] === child
            });
          }
        }
        return child;
      })}
    </div>
  );
}

export function CardHeader({ children, className = '', noBorder = false }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 ${!noBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', noBorder = false }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 ${!noBorder ? 'border-t border-gray-200 dark:border-gray-700' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`p-6 pt-0 ${className}`}
      {...props}
    />
  )
}
