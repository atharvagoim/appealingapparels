export default function Test() {
  return (
    <div>
      {import.meta.env.VITE_API_URL || "NOT FOUND"}
    </div>
  );
}