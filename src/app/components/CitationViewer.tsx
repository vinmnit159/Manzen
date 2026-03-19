/**
 * CitationViewer.tsx — Reusable AI citation display component.
 *
 * Used across all AI output surfaces:
 *   - QuestionnaireAssistantPage (customer due-diligence answers)
 *   - EvidenceSynthesisPanel (evidence-to-control mapping)
 *   - AuditorNotePanel (framework requirement notes)
 *   - TrustCenterResponseHelper (trust portal questionnaire drafts)
 *
 * Renders an expandable list of cited source documents with excerpt text.
 * The plan specifies: "inline expandable source excerpt viewer + link to
 * source document (policy, audit report, prior answer)".
 */

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { AiCitation } from '../../services/api/ai';

// ── Single citation card ───────────────────────────────────────────────────────

interface CitationCardProps {
  citation: AiCitation;
  index: number;
  /** Optional link to the source document — policy page, audit detail, etc. */
  sourceUrl?: string;
}

export function CitationCard({
  citation,
  index,
  sourceUrl,
}: CitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
      <button
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-gray-700">
          <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="text-gray-400 font-mono text-xs mr-0.5">
            [{index + 1}]
          </span>
          <span className="truncate">{citation.documentTitle}</span>
        </span>
        <div className="flex flex-shrink-0 items-center gap-1">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-700"
              title="Open source document"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>
      {expanded && (
        <p className="mt-2 border-t border-gray-200 pt-2 text-xs leading-relaxed text-gray-600">
          {citation.excerpt || 'No excerpt available.'}
        </p>
      )}
    </div>
  );
}

// ── Citation list ─────────────────────────────────────────────────────────────

interface CitationViewerProps {
  citations: AiCitation[];
  /** Optional map of documentId → URL for linking to source documents */
  sourceUrls?: Record<string, string>;
  /** Label for the section header. Defaults to "Sources used" */
  label?: string;
  /** Show the section even if citations is empty (renders a "no sources" note) */
  showWhenEmpty?: boolean;
  className?: string;
}

/**
 * Renders a collapsible list of AI citations.
 *
 * Usage:
 *   <CitationViewer citations={generation.citations} label="Source documents" />
 */
export function CitationViewer({
  citations,
  sourceUrls,
  label = 'Sources used',
  showWhenEmpty = false,
  className,
}: CitationViewerProps) {
  const [open, setOpen] = useState(false);

  if (citations.length === 0 && !showWhenEmpty) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {label} ({citations.length})
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {citations.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No source documents cited.
            </p>
          ) : (
            citations.map((c, i) => (
              <CitationCard
                key={c.chunkId}
                citation={c}
                index={i}
                sourceUrl={sourceUrls?.[c.documentId]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
