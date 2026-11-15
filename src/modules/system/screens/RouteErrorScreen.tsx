import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { AlertTriangle } from "lucide-react";

/**
 * Shown when a screen crashes while rendering, instead of a blank page or
 * the router's developer error. The error itself goes to the console, where
 * it can be reported; the visitor gets a way back.
 */
export default function RouteErrorScreen() {
  const error = useRouteError();
  console.error(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div role="alert" className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-50 text-danger-600">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">
          {notFound ? "Page not found" : "Something went wrong on this page"}
        </h1>
        <p className="mt-2 text-ink-subtle">
          {notFound
            ? "The page you were looking for does not exist or has moved."
            : "Reload to try again. If it keeps happening, tell SmartQueue support what you were doing."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 font-medium text-ink hover:bg-canvas"
          >
            Reload
          </button>
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 font-medium text-white hover:bg-brand-800"
          >
            Go to home
          </Link>
        </div>
      </div>
    </main>
  );
}
