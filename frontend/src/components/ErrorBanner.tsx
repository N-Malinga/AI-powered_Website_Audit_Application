export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <span aria-hidden className="mt-0.5 font-semibold">
        !
      </span>
      <p>{message}</p>
    </div>
  );
}
