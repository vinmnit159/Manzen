/**
 * QuestionnaireAssistantPage.tsx — AI-3: Security questionnaire answer generation
 *
 * Allows users to:
 * 1. Enter a security questionnaire question
 * 2. Generate a draft answer with cited sources (powered by the RAG pipeline)
 * 3. Review, edit, and approve the answer for reuse
 * 4. View and reuse previously approved answers
 *
 * Design rules:
 * - All AI output is PENDING_REVIEW — users must approve before an answer is "official"
 * - Approved answers are stored and reused for similar future questions
 * - Citations are shown so users can verify sources
 * - AI failure never blocks the workflow — fallback to manual entry is always available
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  aiService,
  QuestionnaireAnswerResult,
  ApprovedQuestionnaireAnswer,
} from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONFIDENCE_META: Record<
  'HIGH' | 'MEDIUM' | 'LOW',
  { label: string; color: string; bg: string }
> = {
  HIGH: {
    label: 'High confidence',
    color: 'text-green-700',
    bg: 'bg-green-50',
  },
  MEDIUM: {
    label: 'Medium confidence',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  LOW: {
    label: 'Low confidence — verify sources carefully',
    color: 'text-red-700',
    bg: 'bg-red-50',
  },
};

// ── Generation result panel ───────────────────────────────────────────────────

function GenerationPanel({
  result,
  onApprove,
  onDismiss,
  isApproving,
  isDismissing,
}: {
  result: QuestionnaireAnswerResult;
  onApprove: (editedText: string) => void;
  onDismiss: () => void;
  isApproving: boolean;
  isDismissing: boolean;
}) {
  const [editedText, setEditedText] = useState(result.draftAnswer);
  const [copied, setCopied] = useState(false);
  const confidenceMeta = CONFIDENCE_META[result.confidence];

  function handleCopy() {
    navigator.clipboard.writeText(editedText).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Confidence indicator */}
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${confidenceMeta.bg}`}
      >
        <Sparkles className={`h-4 w-4 ${confidenceMeta.color}`} />
        <span className={`font-medium ${confidenceMeta.color}`}>
          {confidenceMeta.label}
        </span>
        <span className="text-gray-500 ml-auto text-xs">
          Review before sending to customers
        </span>
      </div>

      {/* Editable draft */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">
            Draft answer
          </label>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <textarea
          className="w-full min-h-[160px] rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Edit the draft answer before approving..."
        />
        <p className="mt-1 text-xs text-gray-400">
          You can edit this draft before approving. Approved text is stored for
          reuse.
        </p>
      </div>

      {/* Citations */}
      <CitationViewer
        citations={result.citations}
        label="Sources used"
        className="pt-1"
      />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => onApprove(editedText)}
          disabled={isApproving || isDismissing || !editedText.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isApproving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className="mr-2 h-4 w-4" />
          )}
          Approve and save for reuse
        </Button>
        <Button
          variant="outline"
          onClick={onDismiss}
          disabled={isApproving || isDismissing}
        >
          {isDismissing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ThumbsDown className="mr-2 h-4 w-4" />
          )}
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ── Approved answers list ─────────────────────────────────────────────────────

function ApprovedAnswerItem({
  answer,
}: {
  answer: ApprovedQuestionnaireAnswer;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(answer.approvedAnswer).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          className="text-left flex-1"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {answer.question}
          </p>
          <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Approved{' '}
            {new Date(answer.approvedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy answer"
          >
            <Copy className="h-4 w-4" />
            {copied && <span className="sr-only">Copied</span>}
          </button>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {answer.approvedAnswer}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuestionnaireAssistantPage() {
  const queryClient = useQueryClient();

  // Form state
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Current generation (reset between questions)
  const [currentGeneration, setCurrentGeneration] =
    useState<QuestionnaireAnswerResult | null>(null);
  const [generationDismissed, setGenerationDismissed] = useState(false);
  const [generationApproved, setGenerationApproved] = useState(false);

  // Approved answers list
  const approvedQuery = useQuery({
    queryKey: ['ai-approved-answers'],
    queryFn: () => aiService.listApprovedAnswers(),
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: ({ q, ctx }: { q: string; ctx?: string }) =>
      aiService.generateQuestionnaireAnswer(q, ctx),
    onSuccess: (data) => {
      setCurrentGeneration(data.data);
      setGenerationDismissed(false);
      setGenerationApproved(false);
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, approvedText }: { id: string; approvedText: string }) =>
      aiService.approveQuestionnaireAnswer(id, approvedText),
    onSuccess: () => {
      setGenerationApproved(true);
      queryClient.invalidateQueries({ queryKey: ['ai-approved-answers'] });
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (id: string) => aiService.dismissQuestionnaireAnswer(id),
    onSuccess: () => {
      setGenerationDismissed(true);
    },
  });

  function handleGenerate() {
    if (!question.trim()) return;
    setCurrentGeneration(null);
    generateMutation.mutate({
      q: question.trim(),
      ctx: context.trim() || undefined,
    });
  }

  function handleApprove(editedText: string) {
    if (!currentGeneration) return;
    approveMutation.mutate({
      id: currentGeneration.generationId,
      approvedText: editedText,
    });
  }

  function handleDismiss() {
    if (!currentGeneration) return;
    dismissMutation.mutate(currentGeneration.generationId);
  }

  // Filter approved answers by search
  const approvedAnswers = approvedQuery.data?.data ?? [];
  const filteredAnswers = searchQuery.trim()
    ? approvedAnswers.filter(
        (a) =>
          a.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.approvedAnswer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : approvedAnswers;

  return (
    <PageTemplate
      title="Questionnaire Assistant"
      description="Generate AI-assisted answers to security questionnaires using your organization's policies and documentation."
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl">
        {/* ── Left: Question input + generation result ─────────────────────── */}
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Ask a question
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter a security questionnaire question and get a draft answer
              grounded in your organization's policies and documentation.
            </p>

            <div className="space-y-3">
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="e.g. Does your company have a formal information security policy? What controls do you have in place for access management?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />

              {/* Optional context toggle */}
              <button
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                onClick={() => setShowContextInput((prev) => !prev)}
              >
                {showContextInput ? (
                  <X className="h-3 w-3" />
                ) : (
                  <MessageSquare className="h-3 w-3" />
                )}
                {showContextInput ? 'Hide context' : 'Add context (optional)'}
              </button>

              {showContextInput && (
                <textarea
                  className="w-full min-h-[60px] rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Optional: add context about the questionnaire or who is asking (e.g. 'This is for a SOC 2 customer audit')"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Press Cmd+Enter to generate
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={!question.trim() || generateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate answer
                </Button>
              </div>
            </div>
          </Card>

          {/* Generation result */}
          {generateMutation.isError && (
            <Card className="p-5 border-red-100">
              <p className="text-sm text-red-600">
                Failed to generate answer. Please try again or enter an answer
                manually.
              </p>
            </Card>
          )}

          {currentGeneration && !generationDismissed && !generationApproved && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Draft answer
              </h3>
              <GenerationPanel
                result={currentGeneration}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                isApproving={approveMutation.isPending}
                isDismissing={dismissMutation.isPending}
              />
            </Card>
          )}

          {generationApproved && (
            <Card className="p-5 border-green-100 bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Answer approved and saved for reuse.
                </p>
              </div>
              <button
                className="mt-2 text-xs text-green-600 hover:underline"
                onClick={() => {
                  setQuestion('');
                  setContext('');
                  setCurrentGeneration(null);
                  setGenerationApproved(false);
                }}
              >
                Ask another question
              </button>
            </Card>
          )}

          {generationDismissed && (
            <Card className="p-5 border-gray-100">
              <p className="text-sm text-gray-500">
                Answer dismissed.{' '}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setCurrentGeneration(null);
                    setGenerationDismissed(false);
                  }}
                >
                  Try a different approach
                </button>{' '}
                or write the answer manually.
              </p>
            </Card>
          )}
        </div>

        {/* ── Right: Approved answers library ──────────────────────────────── */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Answer library
                </h2>
                <p className="text-sm text-gray-500">
                  Previously approved answers ready for reuse.
                </p>
              </div>
              {approvedAnswers.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {approvedAnswers.length} saved
                </span>
              )}
            </div>

            {/* Search */}
            {approvedAnswers.length > 3 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search approved answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {approvedQuery.isLoading && (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}

            {!approvedQuery.isLoading && filteredAnswers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  {searchQuery
                    ? 'No matching answers found'
                    : 'No approved answers yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Generate and approve answers to build your library'}
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredAnswers.map((answer) => (
                <ApprovedAnswerItem key={answer.id} answer={answer} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
