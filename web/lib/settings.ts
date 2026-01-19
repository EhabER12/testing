export const fetchSettings = async () => {
  const fallback = { data: {} };
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    console.warn(
      "NEXT_PUBLIC_API_URL is not defined. Using fallback settings."
    );
    return fallback;
  }

  try {
    const normalizedBase = apiBase;

    const revalidateValue = Number.parseInt(
      process.env.NEXT_PUBLIC_SETTINGS_REVALIDATE || "",
      10
    );
    const revalidateSeconds = Number.isFinite(revalidateValue)
      ? Math.max(revalidateValue, 30)
      : 300;

    const res = await fetch(`${normalizedBase}/settings/public`, {
      next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
      const preview = await res.text();
      console.error("Failed to fetch settings", {
        status: res.status,
        statusText: res.statusText,
        bodyPreview: preview.slice(0, 200),
      });
      return fallback;
    }

    const contentType = res.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("application/json")) {
      const preview = await res.text();
      console.error("Expected JSON settings response", {
        contentType,
        bodyPreview: preview.slice(0, 200),
      });
      return fallback;
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching settings", error);
    return fallback;
  }
};
