export type DemoVendor = {
  id: string;
  name: string;
  category: "venue" | "caterer";
  area: string;
  price: string;
  detail: string;
  verifiedOn: string;
  tone: string;
};

export const demoVendors: DemoVendor[] = [
  {
    id: "lagoon-house",
    name: "Lagoon House",
    category: "venue",
    area: "Victoria Island",
    price: "From ₦2.8m",
    detail: "Waterfront · up to 350 guests",
    verifiedOn: "12 Jul 2026",
    tone: tokens.semantic.trustSurface,
  },
  {
    id: "adunni-table",
    name: "Adùnní Table",
    category: "caterer",
    area: "Lekki",
    price: "From ₦9,500 / guest",
    detail: "Nigerian classics · 100–500 guests",
    verifiedOn: "08 Jul 2026",
    tone: tokens.semantic.warningSurface,
  },
  {
    id: "the-assembly",
    name: "The Assembly",
    category: "venue",
    area: "Ikeja GRA",
    price: "From ₦1.9m",
    detail: "Indoor + garden · up to 280 guests",
    verifiedOn: "30 Jun 2026",
    tone: tokens.semantic.infoSurface,
  },
];
import { tokens } from "@mmemme/tokens";
