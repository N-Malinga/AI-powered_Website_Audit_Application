export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-[#eed7d7] bg-[#fdf3f3] p-4 text-sm text-bad"
    >
      <span aria-hidden className="mt-0.5 font-mono font-semibold">
        [!]
      </span>
      <p className="font-sans">{message}</p>
    </div>
  );
}
