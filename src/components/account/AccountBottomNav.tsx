import { NavLink } from 'react-router-dom';
import { ACCOUNT_NAV } from '../../config/accountNav';

export default function AccountBottomNav() {
  return (
    <nav
      aria-label="Account"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-kado-dark/10 bg-kado-offwhite/97 backdrop-blur-md pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]">
        {ACCOUNT_NAV.map(({ to, shortLabel, end, icon: Icon }) => (
          <li key={to} className="min-w-0">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'account-bottom-nav-link flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-0.5 touch-manipulation transition-colors',
                  isActive ? 'text-kado-red' : 'text-kado-dark/40 active:text-kado-dark/70',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'account-bottom-nav-icon flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                      isActive ? 'bg-kado-red/10' : '',
                    ].join(' ')}
                  >
                    <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className="account-bottom-nav-label max-w-full truncate text-[9px] font-black uppercase tracking-wider leading-none">
                    {shortLabel}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
