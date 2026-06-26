import type { ReactNode } from "react";

type MobileTopBarProps = {
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  title: string;
};

export function MobileTopBar({ leftAction, rightAction, title }: MobileTopBarProps) {
  const hasTwoActions = Boolean(leftAction && rightAction);

  return (
    <header className="mobile-topbar">
      <div className="mobile-topbar__side mobile-topbar__side--left">
        {hasTwoActions ? leftAction : (
          <span className="mobile-topbar__brand">
            成她100
            <span aria-hidden className="mobile-topbar__leaf" />
          </span>
        )}
      </div>
      <div className="mobile-topbar__title">{title}</div>
      <div className="mobile-topbar__side mobile-topbar__side--right">{rightAction ?? leftAction}</div>
    </header>
  );
}
