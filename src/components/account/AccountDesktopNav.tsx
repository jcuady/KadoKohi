import { NavLink } from 'react-router-dom';
import { ACCOUNT_NAV } from '../../config/accountNav';

export default function AccountDesktopNav() {
  return (
    <nav
      aria-label="Account sections"
      className="hidden md:block border-b border-kado-dark/8 bg-kado-offwhite"
    >
      <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 scrollbar-none">
        {ACCOUNT_NAV.map(({ to, label, end, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'relative flex min-h-[48px] items-center gap-2 px-4 text-[11px] font-black uppercase tracking-wider transition-colors touch-manipulation',
                  isActive ? 'text-kado-red' : 'text-kado-dark/45 hover:text-kado-dark',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                  {isActive ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-kado-red" aria-hidden />
                  ) : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
