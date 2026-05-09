import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { env, isChatwootConfigured } from "@/lib/env";

export default async function AdminStudentsPage() {
  await requireUser("admin");
  const supabase = await createClient();

  const [{ data: students }, { data: enrollments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),
    supabase.from("enrollments").select("user_id"),
  ]);

  const enrollmentCounts = new Map<string, number>();
  for (const e of enrollments ?? []) {
    const k = e.user_id as string;
    enrollmentCounts.set(k, (enrollmentCounts.get(k) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl md:text-2xl font-semibold text-[#1a1916]">
          Students
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          Everyone with a student account, sorted by most recent.
        </p>
      </header>

      {(students ?? []).length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No students yet"
          description="Once people sign up, they'll appear here."
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Mobile: stacked list */}
          <ul className="md:hidden divide-y divide-black/[0.05]">
            {(students ?? []).map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-4">
                <Avatar name={s.full_name ?? "Student"} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1a1916] truncate">
                    {s.full_name ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-[#6b6a66]">
                    {enrollmentCounts.get(s.id) ?? 0} enrollments · joined{" "}
                    {formatDate(s.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafaf7] text-[11px] uppercase tracking-wide text-[#6b6a66]">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">
                    Enrollments
                  </th>
                  <th className="text-left font-semibold px-5 py-3">Joined</th>
                  {isChatwootConfigured && (
                    <th className="text-right font-semibold px-5 py-3">
                      Conversation
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {(students ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.full_name ?? "Student"} size={32} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a1916] truncate">
                            {s.full_name ?? "Unnamed"}
                          </p>
                          <p className="text-xs text-[#6b6a66] truncate">
                            ID {s.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#1a1916] tabular-nums">
                      {enrollmentCounts.get(s.id) ?? 0}
                    </td>
                    <td className="px-5 py-3 text-sm text-[#6b6a66]">
                      {formatDate(s.created_at)}
                    </td>
                    {isChatwootConfigured && (
                      <td className="px-5 py-3 text-right">
                        <a
                          href={`${env.chatwoot.baseUrl}/app/accounts/1/contacts`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-[#01696f] hover:underline"
                        >
                          View chat ↗
                        </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
