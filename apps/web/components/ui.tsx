"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ProgressStatus } from "../lib/types";
import { IconAlert, IconCheckCircle, IconClock, IconInfo, IconSpark } from "./icons";

const STATUS_META: Record<ProgressStatus, { label: string; className: string }> = {
  completed: { label: "Completada", className: "badge badge-success" },
  in_progress: { label: "En curso", className: "badge badge-warning" },
  pending: { label: "Pendiente", className: "badge badge-info" },
};

export function StatusBadge({ status }: { status?: ProgressStatus | null }) {
  if (!status) {
    return <span className="badge badge-neutral">Sin empezar</span>;
  }
  const meta = STATUS_META[status];
  return <span className={meta.className}>{meta.label}</span>;
}

export function Ring({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="ring"
      style={{ "--pct": pct } as CSSProperties}
      role="img"
      aria-label={`${label}: ${pct}%`}
    >
      <div className="ring-inner">
        <span className="ring-value">{pct}%</span>
        <span className="ring-label">{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon ?? <IconSpark size={20} />}</span>
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function SkeletonList({ rows = 4, height = 52 }: { rows?: number; height?: number }) {
  return (
    <div className="stack" aria-hidden style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="kpi-grid" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-kpi" />
      ))}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "danger";
  children: ReactNode;
}) {
  const Icon = tone === "success" ? IconCheckCircle : tone === "danger" ? IconAlert : IconInfo;
  return (
    <div className={`alert alert-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={16} />
      <span>{children}</span>
    </div>
  );
}

export function TimeAgo({ value }: { value: string | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!value) return <span className="muted">—</span>;
  const date = new Date(value);
  if (!mounted) {
    return (
      <span className="row" style={{ gap: 5, display: "inline-flex" }}>
        <IconClock size={13} />
        {date.toLocaleDateString("es", { day: "numeric", month: "short" })}
      </span>
    );
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  let label: string;
  if (Number.isNaN(diff)) label = "—";
  else if (minutes < 1) label = "ahora";
  else if (minutes < 60) label = `hace ${minutes} min`;
  else if (minutes < 60 * 24) label = `hace ${Math.round(minutes / 60)} h`;
  else if (minutes < 60 * 24 * 7) label = `hace ${Math.round(minutes / (60 * 24))} d`;
  else label = date.toLocaleDateString("es", { day: "numeric", month: "short" });

  return (
    <span className="row" style={{ gap: 5, display: "inline-flex" }} title={date.toLocaleString("es")}>
      <IconClock size={13} />
      {label}
    </span>
  );
}

/* ------------------------- Markdown mínimo ------------------------- */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(<code key={`${keyPrefix}-c-${i++}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-b-${i++}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={`${keyPrefix}-i-${i++}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  if (!source?.trim()) {
    return <p className="muted">Sin contenido todavía.</p>;
  }

  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={`b-${key++}`}>
          <code data-lang={lang || undefined}>{body.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = inline(heading[2], `h-${key}`);
      if (level <= 2) blocks.push(<h2 key={`b-${key++}`}>{content}</h2>);
      else blocks.push(<h3 key={`b-${key++}`}>{content}</h3>);
      i++;
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push(<hr key={`b-${key++}`} className="divider" />);
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={`b-${key++}`}>{inline(body.join(" "), `q-${key}`)}</blockquote>,
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`b-${key++}`}>
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `ul-${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`b-${key++}`}>
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```") &&
      !/^\s*>\s?/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={`b-${key++}`}>{inline(para.join(" "), `p-${key}`)}</p>);
  }

  return <div className="markdown">{blocks}</div>;
}
