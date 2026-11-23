// Line icons in the style the dashboards use (24px grid, 2px stroke).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: P) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    >
      {children}
    </svg>
  );
}

export const SunIcon = (p: P) => (
  <Icon {...p}>
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' />
  </Icon>
);

export const CalendarIcon = (p: P) => (
  <Icon {...p}>
    <rect x='3' y='4' width='18' height='18' rx='2' />
    <path d='M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01' />
  </Icon>
);

export const RepeatIcon = (p: P) => (
  <Icon {...p}>
    <path d='m17 2 4 4-4 4' />
    <path d='M3 11v-1a4 4 0 0 1 4-4h14' />
    <path d='m7 22-4-4 4-4' />
    <path d='M21 13v1a4 4 0 0 1-4 4H3' />
  </Icon>
);

export const ListIcon = (p: P) => (
  <Icon {...p}>
    <path d='M11 6h10M11 12h10M11 18h10' />
    <path d='m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17' />
  </Icon>
);

export const AppleIcon = (p: P) => (
  <Icon {...p}>
    <path d='M12 6.5c-1.5-1.3-4.3-1.6-6 .2-2.3 2.4-1.6 7.2.8 10.6 1.3 1.8 2.8 3 4.2 2.4l1-.4 1 .4c1.4.6 2.9-.6 4.2-2.4 2.4-3.4 3.1-8.2.8-10.6-1.7-1.8-4.5-1.5-6-.2Z' />
    <path d='M12 6.5c0-2 1-3.5 3-4' />
  </Icon>
);

export const ChartIcon = (p: P) => (
  <Icon {...p}>
    <path d='M3 3v16a2 2 0 0 0 2 2h16' />
    <path d='m7 15 4-5 3 3 5-6' />
  </Icon>
);

export const CogIcon = (p: P) => (
  <Icon {...p}>
    <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
    <circle cx='12' cy='12' r='3' />
  </Icon>
);

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d='M20 6 9 17l-5-5' />
  </Icon>
);

export const XIcon = (p: P) => (
  <Icon {...p}>
    <path d='M18 6 6 18M6 6l12 12' />
  </Icon>
);

export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d='M12 5v14M5 12h14' />
  </Icon>
);

export const ChevronLeft = (p: P) => (
  <Icon {...p}>
    <path d='m15 18-6-6 6-6' />
  </Icon>
);

export const ChevronRight = (p: P) => (
  <Icon {...p}>
    <path d='m9 18 6-6-6-6' />
  </Icon>
);

export const PencilIcon = (p: P) => (
  <Icon {...p}>
    <path d='M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z' />
  </Icon>
);

export const TrashIcon = (p: P) => (
  <Icon {...p}>
    <path d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
  </Icon>
);

export const FlameIcon = (p: P) => (
  <Icon {...p}>
    <path d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z' />
  </Icon>
);

export const InboxIcon = (p: P) => (
  <Icon {...p}>
    <path d='M22 12h-6l-2 3h-4l-2-3H2' />
    <path d='M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' />
  </Icon>
);

export const LogoMark = (p: P) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 32 32'
    width='32'
    height='32'
    aria-hidden='true'
    {...p}
  >
    <rect width='32' height='32' rx='6' fill='#0b0f1a' />
    <path
      d='M8 16.5 13.5 22 24 10'
      fill='none'
      stroke='#ff9f00'
      strokeWidth='3.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);
