import React from 'react';
import { Badge } from './ui/badge';
import { CheckCircle, Clock } from 'lucide-react';

interface DataTypeBadgeProps {
  isProjection: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const DataTypeBadge: React.FC<DataTypeBadgeProps> = ({ 
  isProjection, 
  size = 'sm', 
  showIcon = true,
  className = ''
}) => {
  if (isProjection) {
    return (
      <Badge 
        variant="outline" 
        className={`
          bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100
          ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}
          ${size === 'md' ? 'text-sm px-3 py-1' : ''}
          ${size === 'lg' ? 'text-base px-4 py-1.5' : ''}
          ${className}
        `}
      >
        {showIcon && <Clock className="mr-1 h-3 w-3" />}
        Previsionale
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`
        bg-green-50 text-green-700 border-green-200 hover:bg-green-100
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}
        ${size === 'md' ? 'text-sm px-3 py-1' : ''}
        ${size === 'lg' ? 'text-base px-4 py-1.5' : ''}
        ${className}
      `}
    >
      {showIcon && <CheckCircle className="mr-1 h-3 w-3" />}
      Consolidato
    </Badge>
  );
};

export default DataTypeBadge;