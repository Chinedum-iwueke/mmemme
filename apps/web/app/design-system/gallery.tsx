"use client";
import { useState } from "react";
import {
  ActionLink,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Currency,
  DateInput,
  EmptyState,
  ErrorState,
  FormError,
  Input,
  Pagination,
  ProductImage,
  Select,
  Skeleton,
} from "../../components/ui";
import { Dialog, Sheet, Toast } from "../../components/ui/interactive";
const preview =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23294A41'/%3E%3Cpath d='M160 350 Q300 150 400 350 Q500 150 640 350' fill='none' stroke='%2397C354' stroke-width='55'/%3E%3C/svg%3E";
export function ComponentGallery() {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState(false);
  return (
    <div className="gallery__sections">
      <section>
        <h2>Actions and navigation</h2>
        <div className="gallery__row">
          <Button>Request this venue</Button>
          <Button variant="accent">Create wedding brief</Button>
          <Button variant="secondary">Save for later</Button>
          <Button variant="ghost">View terms</Button>
          <Button variant="danger">Cancel request</Button>
          <Button busy>Submitting request</Button>
        </div>
        <ActionLink href="/">Return to marketplace</ActionLink>
        <Breadcrumbs
          items={[
            { label: "Marketplace", href: "/" },
            { label: "Venues", href: "/" },
            { label: "Lagoon House" },
          ]}
        />
        <Pagination page={2} pages={6} />
      </section>
      <section>
        <h2>Forms</h2>
        <div className="gallery__grid">
          <Input
            name="area"
            label="Lagos area"
            hint="For example, Lekki or Ikeja"
            placeholder="Lekki"
          />
          <DateInput name="date" label="Wedding date" />
          <Select name="category" label="Service category">
            <option>Venue</option>
            <option>Caterer</option>
          </Select>
          <Input
            name="email"
            label="Receipt email"
            error="Enter a valid email address"
            defaultValue="amaka@"
          />
        </div>
        <FormError>Enter a valid receipt email before continuing.</FormError>
      </section>
      <section>
        <h2>Trust, money and status</h2>
        <div className="gallery__row">
          <Badge tone="trust">MMEMME Verified · checked 12 Jul 2026</Badge>
          <Badge tone="info">Checking with vendor</Badge>
          <Badge tone="success">Booking confirmed</Badge>
          <Badge tone="warning">Quote expires today</Badge>
          <Badge tone="error">Payment not completed</Badge>
        </div>
        <Card>
          <p>Deposit due now</p>
          <Currency kobo={75000000} />
          <p>Availability is vendor-confirmed before a payment-ready quote is issued.</p>
        </Card>
      </section>
      <section>
        <h2>Listing media and content states</h2>
        <div className="gallery__grid">
          <Card interactive>
            <ProductImage src={preview} alt="Abstract MMEMME venue placeholder" fill unoptimized />
            <h3>Lagoon House</h3>
            <p>Victoria Island · up to 350 guests</p>
            <Currency qualifier="From" kobo={280000000} />
          </Card>
          <Skeleton />
          <EmptyState
            title="No matching vendors"
            action={<Button variant="secondary">Clear filters</Button>}
          >
            Try changing your area, guest count or budget.
          </EmptyState>
          <ErrorState
            title="We couldn't load vendors"
            action={<Button variant="secondary">Try again</Button>}
          >
            Your filters are saved.
          </ErrorState>
        </div>
      </section>
      <section>
        <h2>Overlays and feedback</h2>
        <div className="gallery__row">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
          <Button variant="ghost" onClick={() => setToast(true)}>
            Show toast
          </Button>
        </div>
        <Dialog open={dialog} title="Review booking request" onClose={() => setDialog(false)}>
          <p>Your request does not confirm availability or charge a payment.</p>
        </Dialog>
        <Sheet open={sheet} title="Filter venues" onClose={() => setSheet(false)}>
          <p>Short contextual choices use a sheet; long forms use a full page.</p>
        </Sheet>
        {toast && <Toast tone="success">Your request draft was saved.</Toast>}
      </section>
    </div>
  );
}
