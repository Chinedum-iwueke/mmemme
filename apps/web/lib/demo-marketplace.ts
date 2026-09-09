import type { PublicVendor, VendorCategory } from "./marketplace";

export const DEMO_VENDOR_IDS = new Set([
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
]);

type DemoVendor = {
  id: string;
  name: string;
  category: VendorCategory;
  area: string;
  description: string;
  capacityMin: number;
  capacityMax: number;
  price: number;
  image: string;
  packageName: string;
  packageDescription: string;
  inclusions: string[];
};

const source: DemoVendor[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Lagoon House",
    category: "venue",
    area: "Victoria Island",
    description: "A waterfront celebration venue with indoor and outdoor ceremony options.",
    capacityMin: 100,
    capacityMax: 350,
    price: 280_000_000,
    image: "/images/editorial/lagoon-house.webp",
    packageName: "Full-day wedding hire",
    packageDescription: "Twelve-hour access for ceremony and reception.",
    inclusions: ["Main hall", "Waterfront terrace", "Bridal suite", "Security"],
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "The Assembly",
    category: "venue",
    area: "Ikeja GRA",
    description: "A calm garden and hall setting for intimate and mid-size Lagos weddings.",
    capacityMin: 80,
    capacityMax: 280,
    price: 190_000_000,
    image: "/images/editorial/the-assembly.webp",
    packageName: "Hall and garden",
    packageDescription: "Indoor reception plus garden ceremony.",
    inclusions: ["Reception hall", "Garden", "Parking", "Backup power"],
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Adùnní Table",
    category: "caterer",
    area: "Lekki",
    description: "Nigerian celebration menus presented with modern service and generous portions.",
    capacityMin: 100,
    capacityMax: 500,
    price: 950_000,
    image: "/images/editorial/adunni-table.webp",
    packageName: "Classic celebration menu",
    packageDescription: "Per-guest Nigerian menu with service staff.",
    inclusions: ["Two mains", "Two sides", "Small chops", "Service staff"],
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Ìfẹ́ Kitchen",
    category: "caterer",
    area: "Surulere",
    description: "Classic Lagos party food with structured guest-count packages.",
    capacityMin: 80,
    capacityMax: 400,
    price: 780_000,
    image: "/images/editorial/ife-kitchen.webp",
    packageName: "Lagos favourites",
    packageDescription: "Flexible buffet package for 80 to 400 guests.",
    inclusions: ["Two mains", "Rice selection", "Swallow and soup", "Buffet service"],
  },
];

export const demoInventoryEnabled =
  process.env.NEXT_PUBLIC_MMEMME_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEMO_INVENTORY_ENABLED !== "false";

export const demoVendors: PublicVendor[] = source.map((vendor, index) => ({
  id: vendor.id,
  name: vendor.name,
  category: vendor.category,
  area: vendor.area,
  description: vendor.description,
  capacity_min: vendor.capacityMin,
  capacity_max: vendor.capacityMax,
  price_from_kobo: vendor.price,
  verification_status: "approved",
  verification_expires_at: "2027-09-01T00:00:00.000Z",
  published: true,
  paystack_subaccount_code: null,
  hero_image_path: vendor.image,
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: `2026-09-0${index + 1}T00:00:00.000Z`,
  packages: [
    {
      id: `20000000-0000-4000-8000-00000000000${index + 1}`,
      vendor_id: vendor.id,
      name: vendor.packageName,
      description: vendor.packageDescription,
      price_from_kobo: vendor.price,
      inclusions: vendor.inclusions,
      guest_min: vendor.capacityMin,
      guest_max: vendor.capacityMax,
      active: true,
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    },
  ],
  verification: null,
  imageUrl: vendor.image,
  isPlaceholder: true,
}));
