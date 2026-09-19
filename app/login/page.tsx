import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (error) {
    redirect(`/?auth=login&error=${encodeURIComponent(error)}`);
  }
  redirect("/?auth=login");
}