export const dynamic = "force-static";
export default async function Page() {
  const value = await Promise.resolve(1);
  return <output>{value}</output>;
}
