import { cn } from '@/lib/utils';
import { Menu } from '@/components/menu';
import type { ClassValue } from 'clsx';

export interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  classes?: {
    root?: ClassValue;
    inner?: ClassValue;
  };
}

export function Frame({ className, children, classes, ...props }: FrameProps) {
  return (
    <main
      className={cn('flex min-h-screen flex-col', className, classes?.root)}
      {...props}
    >
      <Menu />
      <div className={cn('flex-1 border-t h-full px-4 py-6', classes?.inner)}>
        {children}
      </div>
    </main>
  );
}
