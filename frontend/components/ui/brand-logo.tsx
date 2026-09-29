import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '../../lib/utils';

interface BrandLogoProps {
  /**
   * 'mark': Circular orbital cross emblem only
   * 'full': Complete vertical emblem with typography
   * 'horizontal': Emblem with adjacent typography lockup
   */
  variant?: 'mark' | 'full' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  href?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

const SIZE_MAP = {
  xs: { img: 24, text: 'text-xs', sub: 'text-[9px]' },
  sm: { img: 32, text: 'text-sm', sub: 'text-[10px]' },
  md: { img: 40, text: 'text-base', sub: 'text-xs' },
  lg: { img: 48, text: 'text-lg', sub: 'text-xs' },
  xl: { img: 64, text: 'text-2xl', sub: 'text-sm' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showSubtitle = true,
  href,
  className,
  theme = 'light',
}) => {
  const currentSize = SIZE_MAP[size];

  const content = (
    <div className={cn('flex items-center gap-2.5 select-none transition-transform group', className)}>
      {variant === 'full' ? (
        <div className="flex flex-col items-center text-center">
          <div className="relative overflow-hidden rounded-2xl p-1">
            <Image
              src="/logo-transparent.png"
              alt="HealthFlow AI"
              width={size === 'xl' ? 220 : size === 'lg' ? 180 : 140}
              height={size === 'xl' ? 170 : size === 'lg' ? 140 : 110}
              className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
              size === 'xs' && 'h-6 w-6',
              size === 'sm' && 'h-8 w-8',
              size === 'md' && 'h-10 w-10',
              size === 'lg' && 'h-12 w-12',
              size === 'xl' && 'h-16 w-16'
            )}
          >
            <Image
              src="/icon-transparent.png"
              alt="HealthFlow AI Emblem"
              width={currentSize.img * 2}
              height={currentSize.img * 2}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {variant === 'horizontal' && (
            <div className="flex flex-col justify-center">
              <span
                className={cn(
                  'font-black tracking-tight leading-none',
                  currentSize.text,
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                )}
              >
                HEALTHFLOW{' '}
                <span className={theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}>AI</span>
              </span>
              {showSubtitle && (
                <span
                  className={cn(
                    'font-semibold tracking-wider uppercase mt-0.5 leading-none',
                    currentSize.sub,
                    theme === 'dark' ? 'text-slate-400' : 'text-teal-700'
                  )}
                >
                  Predict • Prevent • Protect
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};
