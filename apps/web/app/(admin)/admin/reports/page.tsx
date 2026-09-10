"use client";
import { useEffect, useState } from "react";
import { AdminSidebar, AdminTable } from "../../../../components/admin/AdminShell";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/primitives";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  reporter: { email?: string; phone?: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  function load() {
    fetch("/api/admin/reports").then((r) => r.json()).then((d) => setReports(d.reports ?? []));
  }
  useEffect(load, []);

  async function act(reportId: string, status: "RESOLVED" | "DISMISSED") {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status }),
    });
    load();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <h1 className="font-display text-2xl font-semibold mb-6">Reports — Open</h1>
        <AdminTable
          columns={["Type", "Reason", "Reported by", "Status", "Actions"]}
          rows={reports.map((r) => [
            r.targetType,
            r.reason.replace(/_/g, " "),
            r.reporter.email ?? r.reporter.phone ?? "—",
            <Badge key="s">{r.status}</Badge>,
            <div key="actions" className="flex gap-2">
              <Button size="sm" onClick={() => act(r.id, "RESOLVED")}>Resolve</Button>
              <Button size="sm" variant="ghost" onClick={() => act(r.id, "DISMISSED")}>Dismiss</Button>
            </div>,
          ])}
        />
      </main>
    </div>
  );
}
