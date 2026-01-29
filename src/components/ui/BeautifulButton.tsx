'use client';

import { ReactNode, forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from './cn';

interface BeautifulButtonProps extends MotionProps {
  children?: ReactNode;
  icon?: LucideIcon;
  label?: string;
  isActive?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'glass' | 'neon' | 'gradient';
  color?: 'pink' | 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red';
  rounded?: 'full' | 'xl' | '2xl' | '3xl';
  glow?: boolean;
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
}

const sizeClasses = {
  sm: 'p-2 text-sm',
  md: 'p-3 text-base',
  lg: 'p-4 text-lg',
  xl: 'p-5 text-xl'
};

const variantClasses = {
  primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
  secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  glass: 'glass-effect text-gray-800',
  neon: 'neon-effect text-white',
  gradient: 'gradient-effect text-white'
};

const colorGlows = {
  pink: 'glow-pink',
  blue: 'glow-blue',
  purple: 'glow-purple',
  green: 'glow-green',
  orange: 'glow-orange',
  cyan: 'glow-cyan',
  red: 'glow-pink' // 红色使用粉色光晕
};

const roundedClasses = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl'
};

export const BeautifulButton = forwardRef<HTMLButtonElement, BeautifulButtonProps>(({
  children,
  icon: Icon,
  label,
  isActive = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  color = 'pink',
  rounded = 'full',
  glow = false,
  pulse = false,
  className,
  onClick,
  ...props
}, ref) => {
  const roundedClass = roundedClasses[rounded];
  const glowClass = glow ? colorGlows[color] : '';
  
  return (
    <motion.button
      ref={ref}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        y: disabled ? 0 : 1
      }}
      animate={pulse && !disabled ? {
        scale: [1, 1.1, 1],
        boxShadow: [
          '0 0 0 rgba(236, 72, 153, 0.4)',
          '0 0 20px rgba(236, 72, 153, 0.8)',
          '0 0 0 rgba(236, 72, 153, 0.4)'
        ]
      } : {}}
      transition={pulse ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
      className={cn(
        'relative overflow-hidden transition-all duration-300 font-medium',
        'border-2 border-transparent',
        'shadow-lg hover:shadow-xl',
        'backdrop-blur-md',
        sizeClasses[size],
        variantClasses[variant],
        roundedClass,
        glowClass,
        isActive && 'ring-2 ring-white ring-opacity-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {/* 背景光晕效果 */}
      {glow && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20"
          animate={{
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* 点击涟漪效果 */}
      <motion.div 
        className="absolute inset-0 bg-white rounded-full scale-0 opacity-0"
        whileTap={{
          scale: 2,
          opacity: 0.3
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 内容容器 */}
      <div className={cn(
        'relative z-10 flex items-center justify-center gap-2',
        Icon && label ? 'flex-row' : 'flex-col'
      )}>
        {Icon && (
          <motion.div
            animate={{
              y: [0, -2, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : size === 'xl' ? 28 : 20} />
          </motion.div>
        )}
        
        {label && (
          <span className={cn(
            'font-medium',
            size === 'sm' && 'text-xs',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg'
          )}>
            {label}
          </span>
        )}
        
        {children}
      </div>
      
      {/* 激活状态指示器 */}
      {isActive && (
        <motion.div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
      )}
    </motion.button>
  );
});

BeautifulButton.displayName = 'BeautifulButton';

export default BeautifulButton;