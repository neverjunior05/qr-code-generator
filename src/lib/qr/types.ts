export const CONTENT_TYPES = [
  "url", "text", "wifi", "vcard", "email", "sms", "phone",
  "event", "geo", "appstore", "payment", "multilink",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type ErrorCorrection = "L" | "M" | "Q" | "H";
export type DotStyle = "square" | "rounded" | "dots" | "classy" | "extra-rounded";
export type CornerStyle = "square" | "rounded" | "extra-rounded" | "dot" | "classy";
export type GradientType = "none" | "linear" | "radial";

export type ContentValues = {
  url: string; text: string; ssid: string; password: string; encryption: string;
  hidden: boolean; firstName: string; lastName: string; phone: string; email: string;
  company: string; title: string; address: string; website: string; to: string;
  subject: string; body: string; number: string; message: string; start: string;
  end: string; location: string; description: string; latitude: string; longitude: string;
  iosUrl: string; androidUrl: string; recipient: string; amount: string; note: string;
  paymentScheme: string; links: { id: string; label: string; url: string }[];
};

export type QrContent = { type: ContentType; values: ContentValues };

export type QrDesign = {
  foreground: string; background: string; gradientType: GradientType;
  gradientColor: string; gradientRotation: number; dotStyle: DotStyle;
  cornerSquareStyle: CornerStyle; cornerDotStyle: CornerStyle;
  errorCorrection: ErrorCorrection; margin: number; size: number;
  logo: string; logoSize: number; frame: string; frameText: string;
  frameColor: string; preset: string;
};

export type BuilderSnapshot = { content: QrContent; design: QrDesign; name: string };

export const emptyLinks = [{ id: "link-1", label: "My website", url: "https://example.com" }];

export const defaultValues: ContentValues = {
  url: "https://example.com/menu", text: "Made with QRForge", ssid: "Studio_Guest",
  password: "paper;ink:2026", encryption: "WPA", hidden: false,
  firstName: "Avery", lastName: "Stone", phone: "+1 202 555 0147",
  email: "avery@example.com", company: "Paper & Pine Studio", title: "Designer",
  address: "12 Print Lane;Portland;OR;97205;USA", website: "https://example.com",
  to: "hello@example.com", subject: "Hello from QRForge", body: "I found your code!",
  number: "+12025550147", message: "Hello from the print studio",
  start: "2026-08-14T18:00", end: "2026-08-14T20:00", location: "Studio 4, 12 Print Lane",
  description: "An evening of print, paper and pixels.", latitude: "45.5152", longitude: "-122.6784",
  iosUrl: "https://apps.apple.com/example", androidUrl: "https://play.google.com/store/apps/details?id=com.example.app",
  recipient: "studio@example.com", amount: "12.50", note: "Print order", paymentScheme: "upi",
  links: emptyLinks,
};

export const defaultDesign: QrDesign = {
  foreground: "#14121F", background: "#FFFFFF", gradientType: "none",
  gradientColor: "#4F46FF", gradientRotation: 45, dotStyle: "rounded",
  cornerSquareStyle: "extra-rounded", cornerDotStyle: "dot", errorCorrection: "M",
  margin: 4, size: 1024, logo: "", logoSize: 20, frame: "none",
  frameText: "SCAN ME", frameColor: "#4F46FF", preset: "Minimal",
};

export const defaultContent: QrContent = { type: "url", values: { ...defaultValues, links: emptyLinks.map((l) => ({ ...l })) } };

export const typeMeta: Record<ContentType, { label: string; short: string; description: string }> = {
  url: { label: "Website", short: "URL", description: "Open a secure website or landing page." },
  text: { label: "Plain text", short: "Text", description: "Notes, coupons, serials, or UTF-8 text." },
  wifi: { label: "Wi-Fi", short: "Wi-Fi", description: "Join a network without typing a password." },
  vcard: { label: "Contact card", short: "vCard", description: "Save a standards-based vCard 3.0 contact." },
  email: { label: "Email", short: "Email", description: "Compose a pre-filled email message." },
  sms: { label: "SMS", short: "SMS", description: "Start a text message with a prepared note." },
  phone: { label: "Phone", short: "Call", description: "Dial a phone number in one scan." },
  event: { label: "Calendar event", short: "Event", description: "Add an iCalendar VEVENT to a calendar." },
  geo: { label: "Geo location", short: "Map", description: "Open coordinates in the device map app." },
  appstore: { label: "App-store link", short: "Apps", description: "Route visitors to an iOS or Android app listing." },
  payment: { label: "Payment text", short: "Pay", description: "Encode payment-style request text; no funds move here." },
  multilink: { label: "Multi-link page", short: "Links", description: "A hosted link-in-bio page. Dynamic codes only." },
};
