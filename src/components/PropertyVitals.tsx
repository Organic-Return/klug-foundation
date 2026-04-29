// Shared property vitals (beds / baths / sqft / acres) using the
// same icon set rendered on klugproperties.com/search so every
// property card on the site has consistent stat rendering.

interface PropertyVitalsProps {
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  acres?: number | null;
  className?: string;
  iconClassName?: string;
  showDividers?: boolean;
}

const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function BedIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 512 512"
      className={`mr-1 inline align-bottom ${className || ''}`}
      height="1.5em"
      width="1.5em"
      aria-hidden="true"
    >
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
        d="M384 240H96V136a40.12 40.12 0 0140-40h240a40.12 40.12 0 0140 40v104zM48 416V304a64.19 64.19 0 0164-64h288a64.19 64.19 0 0164 64v112"
      />
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={32}
        d="M48 416v-8a24.07 24.07 0 0124-24h368a24.07 24.07 0 0124 24v8M112 240v-16a32.09 32.09 0 0132-32h80a32.09 32.09 0 0132 32v16m0 0v-16a32.09 32.09 0 0132-32h80a32.09 32.09 0 0132 32v16"
      />
    </svg>
  );
}

export function BathIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 24 24"
      className={`mr-1 inline align-bottom ${className || ''}`}
      height="1.5em"
      width="1.5em"
      aria-hidden="true"
    >
      <path d="M21 10H7V7c0-1.103.897-2 2-2s2 .897 2 2h2c0-2.206-1.794-4-4-4S5 4.794 5 7v3H3a1 1 0 0 0-1 1v2c0 2.606 1.674 4.823 4 5.65V22h2v-3h8v3h2v-3.35c2.326-.827 4-3.044 4-5.65v-2a1 1 0 0 0-1-1zm-1 3c0 2.206-1.794 4-4 4H8c-2.206 0-4-1.794-4-4v-1h16v1z" />
    </svg>
  );
}

export function SqftIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 24 24"
      className={`mr-1 inline align-bottom ${className || ''}`}
      height="1.5em"
      width="1.5em"
      aria-hidden="true"
    >
      <path d="M17 19H19V14H10V5H5V7H7V9H5V11H8V13H5V15H7V17H5V19H7V17H9V19H11V16H13V19H15V17H17V19ZM12 12H20C20.5523 12 21 12.4477 21 13V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4V12Z" />
    </svg>
  );
}

export function AcresIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 24 24"
      className={`mr-1 inline align-bottom ${className || ''}`}
      height="1.5em"
      width="1.5em"
      aria-hidden="true"
    >
      <path fill="none" d="M24 24H0V0h24v24z" />
      <path d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12V11H1zm2 8l2.5-3.21 1.79 2.15 2.5-3.22L13 19H3z" />
    </svg>
  );
}

export default function PropertyVitals({
  bedrooms,
  bathrooms,
  squareFeet,
  acres,
  className = '',
  iconClassName = '',
}: PropertyVitalsProps) {
  const items: React.ReactNode[] = [];

  if (bedrooms != null && bedrooms > 0) {
    items.push(
      <span key="bed" className="whitespace-nowrap inline-flex items-center">
        <BedIcon className={iconClassName} />
        {bedrooms}
        <span className="sr-only">bed</span>
      </span>
    );
  }
  if (bathrooms != null && bathrooms > 0) {
    items.push(
      <span key="bath" className="whitespace-nowrap inline-flex items-center">
        <BathIcon className={iconClassName} />
        {bathrooms}
        <span className="sr-only">bath</span>
      </span>
    );
  }
  if (squareFeet != null && squareFeet > 0) {
    items.push(
      <span key="sqft" className="whitespace-nowrap inline-flex items-center">
        <SqftIcon className={iconClassName} />
        {formatNumber(squareFeet)}
        <span className="ml-1">sf</span>
        <span className="sr-only">square feet</span>
      </span>
    );
  }
  if (acres != null && acres > 0) {
    items.push(
      <span key="acres" className="whitespace-nowrap inline-flex items-center">
        <AcresIcon className={iconClassName} />
        {acres < 1 ? acres.toFixed(2) : acres.toFixed(2)}
        <span className="ml-1">ac</span>
        <span className="sr-only">acres</span>
      </span>
    );
  }

  if (items.length === 0) return null;

  return <div className={`flex flex-wrap gap-3 ${className}`}>{items}</div>;
}
