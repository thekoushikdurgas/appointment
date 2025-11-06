import React from 'react';

const iconProps = {
  className: "w-6 h-6",
  strokeWidth: 1.5,
};

export const XMarkIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const GlobeAltIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.004 9.004 0 0112 21" />
    </svg>
);

export const OfficeBuildingIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m-1 4h1m6-10h1m-1 4h1m-1 4h1m-1 4h1" />
    </svg>
);

export const TagIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 17.25 19.5 19.5m-4.5-4.5 2.25 2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-2.25a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25V21" />
    </svg>
);

export const LinkedInIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

export const FacebookIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10s-10 4.477-10 10c0 5.125 3.824 9.352 8.75 9.932v-7.017h-2.625v-2.915h2.625v-2.213c0-2.604 1.55-4.032 3.916-4.032 1.116 0 2.28.198 2.28.198v2.475h-1.288c-1.287 0-1.688.76-1.688 1.62v1.952h2.988l-.48 2.915h-2.508v7.017c4.926-.58 8.75-4.807 8.75-9.932z"/>
    </svg>
);

export const TwitterIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.634 4.218 3.82 4.654-.7.192-1.447.223-2.204.084.616 1.924 2.41 3.282 4.544 3.32-.835.656-1.996 1.047-3.21 1.047-.208 0-.414-.012-.618-.036 2.053 1.322 4.49 2.094 7.078 2.094 8.487 0 13.121-7.022 12.83-13.385.903-.652 1.686-1.465 2.302-2.393z"/>
    </svg>
);

export const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.47-1.47L12.964 18.25l1.188-.648a2.25 2.25 0 011.47 1.47l.648 1.188z" />
    </svg>
);

export const DashboardIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

export const ContactsIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.684v-.568a12.653 12.653 0 01-2.625-3.369" />
  </svg>
);

export const UsersIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.684v-.568a12.653 12.653 0 01-2.625-3.369" />
  </svg>
);

export const PlansIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

export const HistoryIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const OrdersIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const SettingsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.55-.22a2.25 2.25 0 012.122 0l.55.22c.55.219 1.02.684 1.11 1.226l.098.542a2.25 2.25 0 003.352 1.256l.41-.41a2.25 2.25 0 013.182 3.182l-.41.41a2.25 2.25 0 00-1.256 3.352l-.098.542c-.09.542-.56 1.007-1.11 1.226l-.55.22a2.25 2.25 0 01-2.122 0l-.55-.22c-.55-.219-1.02-.684-1.11-1.226l-.098-.542a2.25 2.25 0 00-3.352-1.256l-.41.41a2.25 2.25 0 01-3.182-3.182l.41-.41a2.25 2.25 0 001.256-3.352l.098-.542z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const IdentificationIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zM12 15.75c0-1.078-.75-2.063-1.875-2.063s-1.875.985-1.875 2.063m3.75 0c0-1.078.75-2.063 1.875-2.063s1.875.985 1.875 2.063m-7.5 0c0-1.078.75-2.063 1.875-2.063s1.875.985 1.875 2.063" />
    </svg>
);

export const PaintBrushIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4-2.245 4.5 4.5 0 118.4-2.472c.54-.236 1.06-.536 1.54-.862a4.5 4.5 0 002.36-4.411 3 3 0 00-5.78-1.128 2.25 2.25 0 01-2.4-2.245 4.5 4.5 0 118.4-2.472c.54.236 1.06.536 1.54.862a4.5 4.5 0 002.36 4.411v3.864c0 1.282-.693 2.4-1.82 2.94a2.982 2.982 0 01-1.63.393z" />
    </svg>
);

export const CreditCardIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
);

export const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} strokeWidth={2} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

export const LogoIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className || "w-8 h-8 text-white"} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.08V7.92c0-.41.47-.65.8-.4l5.6 4.08c.33.24.33.76 0 1l-5.6 4.08c-.33.25-.8.01-.8-.4z" />
  </svg>
);

export const SearchIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export const BellIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export const MenuIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const ChevronUpIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);

export const ChevronLeftIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const SunIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

export const MoonIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

export const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

export const ShieldCheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

export const AlertTriangleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export const ArrowRightIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export const PlusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const FilterIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);

export const ChatBubbleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m2.25 2.25H15M3.75 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0Z" />
    </svg>
);


