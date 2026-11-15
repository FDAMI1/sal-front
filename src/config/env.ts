const DEFAULT_API_URL = "http://localhost:5000/api/v1";

const apiUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  "",
);

export const environment = Object.freeze({
  /** Versioned API base, e.g. http://localhost:5000/api/v1 */
  apiUrl,
  /**
   * Server root, where /health lives. Health sits outside /api/v1 so load
   * balancers can probe it without knowing the API version.
   */
  apiOrigin: apiUrl.replace(/\/api\/v\d+$/, ""),
});
