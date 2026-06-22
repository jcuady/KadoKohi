/** Kado Kohi tokens for embedded Clerk SignIn / SignUp / UserButton. */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#C41E3A',
    colorBackground: '#FAF7F2',
    colorText: '#1A1410',
    colorTextSecondary: 'rgba(26, 20, 16, 0.62)',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#1A1410',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontFamilyButtons: 'Inter, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none border border-black/8 bg-white rounded-2xl',
    headerTitle: 'font-display text-xl font-bold text-kado-dark',
    headerSubtitle: 'text-sm text-kado-dark/60',
    formButtonPrimary:
      'bg-kado-red hover:bg-kado-red/90 text-white font-semibold rounded-xl normal-case text-sm',
    formFieldInput: 'rounded-xl border-black/12 text-kado-dark',
    footerActionLink: 'text-kado-red font-semibold hover:text-kado-red/80',
    identityPreviewEditButton: 'text-kado-red',
    userButtonPopoverCard: 'border border-black/8 shadow-lg',
    userButtonPopoverActionButton: 'text-kado-dark',
    userButtonPopoverFooter: 'hidden',
  },
};

/** Management portal: email/password only — no self-sign-up, no Google/social. */
export const internalPortalClerkAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorBackground: '#232323',
    colorText: '#FAF7F2',
    colorTextSecondary: 'rgba(250, 247, 242, 0.62)',
    colorInputBackground: '#1a1a1a',
    colorInputText: '#FAF7F2',
  },
  elements: {
    ...clerkAppearance.elements,
    card: 'shadow-none border border-white/10 bg-[#232323] rounded-2xl',
    headerTitle: 'font-display text-xl font-bold text-kado-cream',
    headerSubtitle: 'text-sm text-kado-cream/60',
    formFieldInput: 'rounded-xl border-white/12 bg-[#1a1a1a] text-kado-cream',
    footerAction: '!hidden',
    footerActionLink: '!hidden',
    socialButtons: '!hidden',
    socialButtonsBlockButton: '!hidden',
    socialButtonsIconButton: '!hidden',
    dividerRow: '!hidden',
    dividerLine: '!hidden',
    dividerText: '!hidden',
  },
};
