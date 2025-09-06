"use client";
import { useEffect, useState } from "react";

export default function Page({ params }: { params: { category: string } }) {
  const slug = decodeURIComponent(params.category || "");
  const tag = slug.toLowerCase();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/api/auth/feed/?tag=${encodeURIComponent(tag)}`;
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then(d => setItems(d.results || d || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tag]);

  if (loading) return <div className="p-6">Loading #{tag}…</div>;
  if (!items.length) return <div className="p-6">No posts for #{tag}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">#{tag}</h1>
      {items.map((it:any, i:number) => (
        <div key={i} className="p-4 rounded-lg border">
          <div className="font-medium">{it.author?.username || "User"}</div>
          {it.image ? <img src={it.image} alt="" className="my-2 max-w-full rounded" /> : null}
          <div>{it.text || it.caption || ""}</div>
        </div>
      ))}
    </div>
  );
}
