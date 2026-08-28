import Image, { type ImageProps } from "next/image";
import Link, { type LinkProps } from "next/link";
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import "./ui.css";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  busy?: boolean;
};
export function Button({
  variant = "primary",
  busy = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`mm-button mm-button--${variant}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? `${children}…` : children}
    </button>
  );
}
export function ActionLink({
  className = "",
  ...props
}: LinkProps & { children: ReactNode; className?: string }) {
  return <Link className={`mm-link ${className}`} {...props} />;
}
type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};
export function Input({ label, hint, error, id, ...props }: FieldProps) {
  const fieldId = id ?? `field-${props.name}`;
  return (
    <label className="mm-field" htmlFor={fieldId}>
      <span>{label}</span>
      <input
        id={fieldId}
        aria-describedby={hint || error ? `${fieldId}-help` : undefined}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {(error || hint) && (
        <small id={`${fieldId}-help`} className={error ? "mm-field__error" : ""}>
          {error ?? hint}
        </small>
      )}
    </label>
  );
}
export function DateInput(props: Omit<FieldProps, "type">) {
  return <Input type="date" {...props} />;
}
export function Select({
  label,
  hint,
  error,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const fieldId = id ?? `field-${props.name}`;
  return (
    <label className="mm-field" htmlFor={fieldId}>
      <span>{label}</span>
      <select
        id={fieldId}
        aria-describedby={hint || error ? `${fieldId}-help` : undefined}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {(error || hint) && (
        <small id={`${fieldId}-help`} className={error ? "mm-field__error" : ""}>
          {error ?? hint}
        </small>
      )}
    </label>
  );
}
export function Currency({ kobo, qualifier }: { kobo: number; qualifier?: string }) {
  return (
    <span className="mm-currency">
      {qualifier && <small>{qualifier} </small>}₦{Math.round(kobo / 100).toLocaleString("en-NG")}
    </span>
  );
}
export function Badge({
  tone = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "trust" | "info" | "success" | "warning" | "error";
}) {
  return (
    <span className={`mm-badge mm-badge--${tone}`} {...props}>
      {children}
    </span>
  );
}
export function Card({
  interactive = false,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { interactive?: boolean }) {
  return (
    <article
      className={`mm-card ${interactive ? "mm-card--interactive" : ""} ${className}`}
      {...props}
    />
  );
}
export function ProductImage({ alt, ...props }: ImageProps) {
  return (
    <span className="mm-image">
      <Image alt={alt} sizes="(max-width: 600px) 100vw, 50vw" {...props} />
    </span>
  );
}
export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="mm-breadcrumbs">
        {items.map((item, index) => (
          <li key={item.label}>
            {item.href ? (
              <ActionLink href={item.href}>{item.label}</ActionLink>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
            {index < items.length - 1 && <span aria-hidden> / </span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function Pagination({
  page,
  pages,
  onPage,
  current,
  total,
  hrefForPage,
}: {
  page?: number;
  pages?: number;
  onPage?: (page: number) => void;
  current?: number;
  total?: number;
  hrefForPage?: (page: number) => string;
}) {
  const active = current ?? page ?? 1;
  const count = total ?? pages ?? 1;
  const Control = ({ target, children }: { target: number; children: ReactNode }) =>
    hrefForPage ? (
      target < 1 || target > count ? (
        <span aria-disabled="true">{children}</span>
      ) : (
        <a href={hrefForPage(target)}>{children}</a>
      )
    ) : (
      <button disabled={target < 1 || target > count} onClick={() => onPage?.(target)}>
        {children}
      </button>
    );
  return (
    <nav aria-label="Pagination" className="mm-pagination">
      <Control target={active - 1}>Previous</Control>
      <span aria-live="polite">
        Page {active} of {count}
      </span>
      <Control target={active + 1}>Next</Control>
    </nav>
  );
}
export function Skeleton({ label = "Loading content" }: { label?: string }) {
  return (
    <div className="mm-skeleton" role="status">
      <span className="sr-only">{label}</span>
    </div>
  );
}
function State({
  tone,
  title,
  children,
  action,
}: {
  tone: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`mm-state mm-state--${tone}`}>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </section>
  );
}
export const EmptyState = (props: Omit<Parameters<typeof State>[0], "tone">) => (
  <State tone="empty" {...props} />
);
export const ErrorState = (props: Omit<Parameters<typeof State>[0], "tone">) => (
  <State tone="error" {...props} />
);
export function FormError({ children }: { children: ReactNode }) {
  return (
    <div className="mm-form-error" role="alert">
      <strong>Check your details</strong>
      <p>{children}</p>
    </div>
  );
}
