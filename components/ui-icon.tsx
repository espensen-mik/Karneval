import type { SVGProps } from "react";

const paths = {
  expand: "M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5",
  arrow: "M5 19 19 5M5 5h14v14",
  refresh: "M20 7v5h-5M19 12a7 7 0 1 0-2 5M20 7l-3-3",
  close: "m6 6 12 12M6 18 18 6",
  digital: "M4 4h16v13H4zM9 21h6M12 17v4M8 8h8M8 12h5",
  home: "m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10",
  soul: "M12 2v20M2 12h20M5 5l14 14M5 19 19 5",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  quote: "M4 6h6v7H5c0 3 1 4 3 5M14 6h6v7h-5c0 3 1 4 3 5",
  undo: "M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12",
  check: "m5 12 4 4 10-10",
} as const;

export type IconName = keyof typeof paths;
export default function UiIcon({ name, className = "", ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg {...props} className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
