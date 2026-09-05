export function ActionIcon({
  name,
}: {
  name: "edit" | "delete" | "view" | "save" | "loading" | "whatsapp";
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 fill-none stroke-current stroke-[1.8] ${name === "loading" ? "animate-spin" : ""}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "edit" ? (
        <>
          <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z" />
        </>
      ) : name === "delete" ? (
        <>
          <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
        </>
      ) : name === "view" ? (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : name === "save" ? (
        <>
          <path d="M4 3h13l4 4v14H3V3h1ZM7 3v6h10V3M7 21v-8h10v8" />
        </>
      ) : name === "whatsapp" ? (
        <>
          <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" />
          <path d="M9 8.5c.2-.5.5-.5.8-.5h.5c.2 0 .4.2.5.5l.6 1.5c.1.3.1.5-.1.7l-.5.5c.7 1.2 1.5 1.9 2.7 2.5l.5-.5c.2-.2.4-.2.7-.1l1.5.6c.3.1.5.3.5.5v.5c0 .3 0 .6-.5.8-2.1.7-6.6-3.3-6.7-6.5Z" />
        </>
      ) : (
        <path d="M21 12a9 9 0 1 1-9-9" />
      )}
    </svg>
  );
}
