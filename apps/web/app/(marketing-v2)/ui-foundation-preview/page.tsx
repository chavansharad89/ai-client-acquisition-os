// Internal verification route for the new Tailwind v4 + shadcn/ui
// foundation — not a real marketing page. Confirms the isolated pipeline
// compiles and renders correctly without touching any existing route.
// Safe to delete once the first real pilot route is built in its place.
export const metadata = {
  title: 'UI Foundation Preview',
  robots: { index: false, follow: false },
};

export default function UiFoundationPreviewPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Tailwind + shadcn/ui foundation</h1>
      <p className="text-muted-foreground">
        This route confirms the new, isolated Tailwind v4 pipeline compiles and renders correctly
        without touching any existing route.
      </p>
      <button
        type="button"
        className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Example button
      </button>
    </main>
  );
}
