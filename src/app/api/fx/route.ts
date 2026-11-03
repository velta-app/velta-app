/** Latest USD → MXN rate. Cached for 6h at the edge/data cache. */
export async function GET() {
  const sources = [
    async () => {
      const res = await fetch(
        "https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN",
        { next: { revalidate: 21600 } }
      );
      const json = (await res.json()) as { rates?: { MXN?: number }; date?: string };
      return { rate: json.rates?.MXN, date: json.date };
    },
    async () => {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 21600 },
      });
      const json = (await res.json()) as {
        rates?: { MXN?: number };
        time_last_update_utc?: string;
      };
      return { rate: json.rates?.MXN, date: json.time_last_update_utc };
    },
  ];

  for (const source of sources) {
    try {
      const { rate, date } = await source();
      if (rate && Number.isFinite(rate)) {
        return Response.json({ rate: Math.round(rate * 10000) / 10000, date });
      }
    } catch {
      // try the next source
    }
  }
  return Response.json({ error: "Rate unavailable" }, { status: 503 });
}
