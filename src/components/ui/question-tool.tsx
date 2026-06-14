/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HelpCircle, ChevronUp, ChevronDown, Check, Sparkles, Loader } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QUESTION_CUSTOM_ID = "__custom__";

function optionBadge(idx: number) {
  return String.fromCharCode(65 + idx);
}

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
};

export type QuestionConfig = {
  kind: "single" | "multi" | "text";
  title: string;
  description?: string;
  options?: QuestionOption[];
  allowCustom?: boolean;
  customLabel?: string;
  customPlaceholder?: string;
  minSelections?: number;
  maxSelections?: number;
  placeholder?: string;
};

export type QuestionAnswer = {
  kind: "single" | "multi" | "text" | "skip";
  selectedIds?: string[];
  text?: string;
};

export type QuestionPromptProps = {
  questions: QuestionConfig[];
  questionIndex?: number;
  totalQuestions?: number;
  onPreviousQuestion?: () => void;
  onNextQuestion?: () => void;
  initialAnswer?: QuestionAnswer;
  submitLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
  onSubmit: (answer: QuestionAnswer) => void;
  onSkip?: () => void;
  className?: string;
  key?: React.Key | string;
};

export function QuestionPrompt({
  questions,
  questionIndex = 1,
  totalQuestions,
  onPreviousQuestion,
  onNextQuestion,
  submitLabel = "Send",
  nextLabel = "Next Question",
  skipLabel = "Skip",
  allowSkip = true,
  initialAnswer,
  onSubmit,
  onSkip,
  className,
}: QuestionPromptProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [textValue, setTextValue] = useState("");
  const resolvedTotal = totalQuestions ?? questions.length;
  const clampedIndex = Math.max(1, Math.min(questionIndex, resolvedTotal));
  const activeQuestion = questions[clampedIndex - 1];
  const customEnabled = activeQuestion?.allowCustom ?? false;
  const showNav = resolvedTotal > 1 && (!!onPreviousQuestion || !!onNextQuestion);
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < resolvedTotal;
  const isLastQuestion = clampedIndex >= resolvedTotal;
  const primaryLabel = isLastQuestion ? submitLabel : nextLabel;

  useEffect(() => {
    if (!initialAnswer || initialAnswer.kind === "skip") {
      setSelectedIds([]);
      setCustomText("");
      setTextValue("");
      return;
    }
    if (activeQuestion?.kind === "text") {
      setSelectedIds([]);
      setCustomText("");
      setTextValue(initialAnswer.text ?? "");
      return;
    }
    const nextSelected = new Set(initialAnswer.selectedIds ?? []);
    const nextCustomText = initialAnswer.text ?? "";
    if (customEnabled && nextCustomText.trim().length > 0) {
      nextSelected.add(QUESTION_CUSTOM_ID);
    }
    setSelectedIds(Array.from(nextSelected));
    setCustomText(nextCustomText);
    setTextValue("");
  }, [
    activeQuestion?.kind,
    clampedIndex,
    customEnabled,
    initialAnswer?.kind,
    initialAnswer?.text,
    initialAnswer?.selectedIds?.join("|"),
  ]);

  const canSubmit = useMemo(() => {
    if (activeQuestion?.kind === "text") return textValue.trim().length > 0;
    const selectedNonCustom = selectedIds.filter((id) => id !== QUESTION_CUSTOM_ID).length;
    const hasCustomText = customText.trim().length > 0;
    const total = selectedNonCustom + (hasCustomText ? 1 : 0);
    if (activeQuestion?.kind === "single") return total === 1;
    const min = activeQuestion?.minSelections ?? 1;
    const max = activeQuestion?.maxSelections;
    if (total < min) return false;
    if (typeof max === "number" && total > max) return false;
    return total > 0;
  }, [
    activeQuestion?.kind,
    activeQuestion?.minSelections,
    activeQuestion?.maxSelections,
    selectedIds,
    customText,
    textValue,
  ]);

  const toggleMulti = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSingleSelect = (id: string) => {
    setSelectedIds([id]);
  };

  const handleCustomTextChange = (nextValue: string) => {
    setCustomText(nextValue);
    if (!activeQuestion) return;
    if (activeQuestion.kind === "single") {
      setSelectedIds(nextValue.trim().length > 0 ? [QUESTION_CUSTOM_ID] : []);
      return;
    }
    setSelectedIds((prev) => {
      const hasCustom = prev.includes(QUESTION_CUSTOM_ID);
      if (nextValue.trim().length > 0 && !hasCustom) {
        return [...prev, QUESTION_CUSTOM_ID];
      }
      if (nextValue.trim().length === 0 && hasCustom) {
        return prev.filter((id) => id !== QUESTION_CUSTOM_ID);
      }
      return prev;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || !activeQuestion) return;
    if (activeQuestion.kind === "text") {
      onSubmit({ kind: "text", text: textValue.trim() });
      return;
    }
    const selectedNonCustom = selectedIds.filter((id) => id !== QUESTION_CUSTOM_ID);
    const answerText = customText.trim() || undefined;
    onSubmit({
      kind: activeQuestion.kind,
      selectedIds: selectedNonCustom,
      text: answerText || undefined,
    });
  };

  const handleSkip = () => {
    onSkip?.();
    onSubmit({ kind: "skip" });
  };

  if (!activeQuestion) return null;

  const optionRowBase =
    "w-full text-left rounded-xl p-3 flex items-center justify-between gap-3 border transition-all duration-200 cursor-pointer text-xs font-semibold";
  const badgeBase =
    "h-6 w-6 rounded-lg inline-flex items-center justify-center text-xs font-black border tracking-wider font-mono shrink-0";
  const badgeOff =
    "bg-gray-50 text-gray-400 border-gray-200/80 hover:bg-gray-100 hover:text-gray-600";
  const badgeOn =
    "bg-primary text-white border-primary-light shadow-[0_4px_12px_rgba(0,69,13,0.15)]";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-6 px-2.5 rounded-full bg-emerald-50 text-[10px] font-extrabold text-primary font-mono select-none uppercase border border-emerald-100/60 leading-none flex items-center">
            Query {clampedIndex}
          </span>
          {activeQuestion.description && (
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
              Action Metric
            </span>
          )}
        </div>
        <h4 className="text-sm font-extrabold text-gray-950 tracking-tight leading-snug">
          {activeQuestion.title}
        </h4>
        {activeQuestion.description && (
          <p className="text-xs text-gray-400 leading-normal font-normal">
            {activeQuestion.description}
          </p>
        )}
      </div>

      {activeQuestion.kind !== "text" && (activeQuestion.options?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {activeQuestion.options!.map((option, idx) => {
            const checked = selectedIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (activeQuestion.kind === "single") {
                    handleSingleSelect(option.id);
                    if (customEnabled) setCustomText("");
                  } else {
                    toggleMulti(option.id);
                  }
                }}
                className={cn(
                  optionRowBase,
                  checked
                    ? "bg-emerald-50/40 border-primary-light text-primary"
                    : "bg-gray-50/40 border-gray-150 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(badgeBase, checked ? badgeOn : badgeOff)}>
                    {optionBadge(idx)}
                  </span>
                  <div className="text-left">
                    <span className="block leading-snug">{option.label}</span>
                    {option.description && (
                      <span className="text-[10px] block leading-normal text-emerald-700 font-medium font-mono pt-0.5">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
                {checked && <Check className="h-4 w-4 text-primary shrink-0 animate-scaleIn" />}
              </button>
            );
          })}

          {customEnabled && (
            <div
              className={cn(
                "w-full rounded-xl p-3 flex items-center justify-between gap-3 border transition-all duration-200 text-xs font-semibold select-none cursor-pointer",
                selectedIds.includes(QUESTION_CUSTOM_ID)
                  ? "bg-emerald-50/40 border-primary-light text-primary"
                  : "bg-gray-50/40 border-gray-150 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
              onClick={() => {
                if (activeQuestion.kind === "single") {
                  handleSingleSelect(QUESTION_CUSTOM_ID);
                } else {
                  toggleMulti(QUESTION_CUSTOM_ID);
                }
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <span className={cn(badgeBase, selectedIds.includes(QUESTION_CUSTOM_ID) ? badgeOn : badgeOff)}>
                  {optionBadge(activeQuestion.options!.length)}
                </span>
                <input
                  type="text"
                  value={customText}
                  onChange={(event) => handleCustomTextChange(event.target.value)}
                  placeholder={activeQuestion.customPlaceholder ?? "Specify another action..."}
                  className="w-full bg-transparent border-0 outline-none p-0 text-xs text-gray-800 placeholder:text-gray-400 font-medium focus:ring-0 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeQuestion.kind === "single") {
                      handleSingleSelect(QUESTION_CUSTOM_ID);
                    } else if (!selectedIds.includes(QUESTION_CUSTOM_ID)) {
                      toggleMulti(QUESTION_CUSTOM_ID);
                    }
                  }}
                  onFocus={() => {
                    if (activeQuestion.kind === "single") {
                      handleSingleSelect(QUESTION_CUSTOM_ID);
                    } else if (!selectedIds.includes(QUESTION_CUSTOM_ID)) {
                      toggleMulti(QUESTION_CUSTOM_ID);
                    }
                  }}
                />
              </div>
              {selectedIds.includes(QUESTION_CUSTOM_ID) && <Check className="h-4 w-4 text-primary shrink-0 animate-scaleIn" />}
            </div>
          )}
        </div>
      )}

      {activeQuestion.kind === "text" && (
        <textarea
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
          placeholder={activeQuestion.placeholder ?? "Describe your daily actions..."}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 resize-none outline-none focus:border-primary-light transition-all shadow-sm"
        />
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          {showNav && onPreviousQuestion && (
            <button
              type="button"
              onClick={onPreviousQuestion}
              disabled={!canGoPrev}
              className="h-8 px-3 rounded-lg text-[10px] font-mono tracking-wider font-extrabold text-gray-400 hover:text-gray-800 disabled:opacity-30 disabled:pointer-events-none uppercase transition-colors"
            >
              Back
            </button>
          )}
          {showNav && onNextQuestion && (
            <button
              type="button"
              onClick={onNextQuestion}
              disabled={!canGoNext}
              className="h-8 px-3 rounded-lg text-[10px] font-mono tracking-wider font-extrabold text-gray-400 hover:text-gray-800 disabled:opacity-30 disabled:pointer-events-none uppercase transition-colors"
            >
              Skip Query
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {skipLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-9 px-4 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-primary text-white hover:bg-primary-light disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>{primaryLabel}</span>
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAnswer(answer: QuestionAnswer) {
  if (answer.kind === "skip") return "Skipped";
  if (answer.kind === "text") return answer.text || "Answered";
  const ids = answer.selectedIds?.length ? answer.selectedIds.join(", ") : "";
  if (answer.text) return ids ? `${ids} (${answer.text})` : answer.text;
  return ids || "Answered";
}

export type QuestionToolProps = {
  questions: QuestionConfig[];
  questionIndex?: number;
  totalQuestions?: number;
  onPreviousQuestion?: () => void;
  onNextQuestion?: () => void;
  submitLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
  onSubmitAnswer?: (answer: QuestionAnswer, index: number) => void;
  isSyncing?: boolean;
  onFinalSubmit?: () => void;
  /** When provided, renders the summary state with this answer. */
  output?: { answer?: QuestionAnswer };
  /** Stable id used to reset internal state when the question set changes. */
  toolCallId?: string;
  className?: string;
};

export function QuestionTool({
  questions,
  questionIndex,
  totalQuestions: totalQuestionsProp,
  onPreviousQuestion,
  onNextQuestion,
  submitLabel = "Submit EcoPulse Check",
  nextLabel,
  skipLabel,
  allowSkip = false,
  onSubmitAnswer,
  isSyncing = false,
  onFinalSubmit,
  output,
  toolCallId,
  className,
}: QuestionToolProps) {
  const totalQuestions = totalQuestionsProp ?? questions.length;
  const [localIndex, setLocalIndex] = useState(questionIndex ?? 1);
  const isControlled = typeof questionIndex === "number";
  const effectiveIndex = isControlled ? (questionIndex ?? 1) : questions.length > 0 ? localIndex : 1;
  const clampedIndex = Math.max(1, Math.min(effectiveIndex, totalQuestions));
  const question = questions[clampedIndex - 1];
  const [localAnswers, setLocalAnswers] = useState<Record<number, QuestionAnswer>>({});

  useEffect(() => {
    if (typeof questionIndex === "number") {
      setLocalIndex(questionIndex);
    }
  }, [questionIndex]);

  useEffect(() => {
    setLocalAnswers({});
    setLocalIndex(questionIndex ?? 1);
  }, [toolCallId]);

  const outputAnswer = output?.answer;
  const answeredCount = Object.keys(localAnswers).length;
  
  // Completed is when they have successfully answered all totalQuestions
  const isComplete = totalQuestions === 1
    ? !!outputAnswer || answeredCount >= 1
    : totalQuestions > 0 && answeredCount >= totalQuestions;

  const showNavigation = totalQuestions > 1 && !isComplete;
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < totalQuestions;

  const goPrev = () => {
    if (!canGoPrev) return;
    onPreviousQuestion?.();
    if (!isControlled) {
      setLocalIndex((prev) => Math.max(1, prev - 1));
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    onNextQuestion?.();
    if (!isControlled) {
      setLocalIndex((prev) => Math.min(totalQuestions, prev + 1));
    }
  };

  if (!question) return null;

  return (
    <div
      className={cn(
        "rounded-[2rem] border border-gray-200 bg-white overflow-hidden shadow-sm p-5 lg:p-6 space-y-4",
        className
      )}
    >
      {/* Questionnaire Top Status Header */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider uppercase text-gray-400 pb-3 border-b border-gray-100">
        <div className="inline-flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>Daily 30sec Sustainability Check</span>
        </div>
        {showNavigation && (
          <div className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-gray-500">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="size-4 inline-flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-gray-500"
              aria-label="Previous question"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[9px] font-black text-primary font-mono">
              {clampedIndex} of {totalQuestions}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="size-4 inline-flex items-center justify-center rounded-md hover:bg-gray-150 disabled:opacity-30 cursor-pointer text-gray-500"
              aria-label="Next question"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isComplete ? (
        <div className="space-y-4 py-3 text-center" id="wizard-completed-screen">
          <div className="size-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-primary border border-emerald-100 animate-bounce">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">EcoPulse Log Ready</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You have completed all 5 metrics of today's sustainability assessment! Hit synchronise below to log progress.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-left border border-gray-100 space-y-2">
            <span className="text-[9px] font-mono font-black uppercase tracking-wider text-gray-400 block border-b border-gray-150 pb-1">
              Active Session Compilation
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600">
              <div>🚗 Commute:</div>
              <div className="text-right text-primary font-mono truncate max-w-[120px]">
                {localAnswers[1]?.text ? `Custom: ${localAnswers[1].text}` : localAnswers[1]?.selectedIds?.[0] ? "Reported" : "Pending"}
              </div>
              <div>♻️ Plastic Reduction:</div>
              <div className="text-right text-primary font-mono truncate max-w-[120px]">
                {localAnswers[2]?.text ? `Custom: ${localAnswers[2].text}` : localAnswers[2]?.selectedIds?.[0] ? "Reported" : "Pending"}
              </div>
              <div>🍎 Waste Separation:</div>
              <div className="text-right text-primary font-mono truncate max-w-[120px]">
                {localAnswers[3]?.text ? `Custom: ${localAnswers[3].text}` : localAnswers[3]?.selectedIds?.[0] === "yes" ? "Yes" : "No"}
              </div>
              <div>🌱 Organic Composting:</div>
              <div className="text-right text-primary font-mono truncate max-w-[120px]">
                {localAnswers[4]?.text ? `Custom: ${localAnswers[4].text}` : localAnswers[4]?.selectedIds?.[0] === "yes" ? "Yes" : "No"}
              </div>
              <div>💡 Inactive Cutoff:</div>
              <div className="text-right text-primary font-mono truncate max-w-[120px]">
                {localAnswers[5]?.text ? `Custom: ${localAnswers[5].text}` : localAnswers[5]?.selectedIds?.[0] === "yes" ? "Yes" : "No"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFinalSubmit}
            disabled={isSyncing}
            className="w-full bg-[#00450d] hover:bg-[#1b6d24] text-white text-xs font-mono font-bold tracking-wider uppercase py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            {isSyncing ? (
              <Loader className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
            )}
            <span>{submitLabel}</span>
          </button>
        </div>
      ) : (
        <QuestionPrompt
          key={`${clampedIndex}-${question.title}`}
          questions={questions}
          questionIndex={clampedIndex}
          totalQuestions={totalQuestions}
          initialAnswer={localAnswers[clampedIndex]}
          nextLabel={nextLabel}
          skipLabel={skipLabel}
          allowSkip={allowSkip}
          onSubmit={(nextAnswer) => {
            setLocalAnswers((prev) => ({
              ...prev,
              [clampedIndex]: nextAnswer,
            }));
            
            // Invoke callback to update live scoring preview in parent
            onSubmitAnswer?.(nextAnswer, clampedIndex);
            
            if (clampedIndex < totalQuestions) {
              goNext();
            }
          }}
        />
      )}
    </div>
  );
}
