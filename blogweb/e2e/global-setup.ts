const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:6133';

export default async function globalSetup() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`BlogApi health check failed: HTTP ${res.status}`);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'unknown error';
    throw new Error(
      `BlogApi is not reachable at ${API_BASE}. Start it with: dotnet run --project BlogApi.API\n(${message})`
    );
  }
}
