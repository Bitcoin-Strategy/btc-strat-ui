import type { ReactNode } from 'react';

interface ContractSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ContractSection({
  title,
  description,
  children,
}: ContractSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-orange mb-1 text-xl font-bold">{title}</h2>
        {description && <p className="text-muted text-sm">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}
