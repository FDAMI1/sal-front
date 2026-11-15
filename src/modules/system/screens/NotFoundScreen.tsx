import { Link } from "react-router";

export default function NotFoundScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-ink-subtle">
          The page you were looking for does not exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 font-medium text-white hover:bg-brand-800"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
