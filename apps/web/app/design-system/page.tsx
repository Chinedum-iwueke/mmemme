import { ComponentGallery } from "./gallery";
import "./gallery.css";
export const metadata = { title: "MMEMME web component gallery" };
export default function DesignSystemPage() {
  return (
    <main className="gallery">
      <header>
        <p className="gallery__eyebrow">Production UX foundation</p>
        <h1>MMEMME web components</h1>
        <p>
          Accessible primitives for discovery, requests, quotes, payments, support and operations.
        </p>
      </header>
      <ComponentGallery />
    </main>
  );
}
