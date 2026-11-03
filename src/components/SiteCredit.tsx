export function SiteCredit({ className = "" }: { className?: string }): JSX.Element {
  return (
    <p className={`text-xs ${className}`}>
      Built by{" "}
      <a
        href="https://stepthrough.au/"
        target="_blank"
        rel="noopener"
        className="underline hover:opacity-80"
      >
        Stepthrough
      </a>{" "}
      &middot;{" "}
      <a href="mailto:contact@stepthrough.au" className="underline hover:opacity-80">
        contact@stepthrough.au
      </a>
    </p>
  );
}
