'use client';

import { forwardRef } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import type {
  ReviewIssue,
  ReviewMetrics,
  ReviewSummary,
  SupportedLanguage,
  TokenUsage,
  ReviewPhase,
} from '@/lib/types';
import { SUPPORTED_LANGUAGES, REVIEW_PHASES } from '@/lib/types';

const severityColor: Record<
  ReviewIssue['severity'],
  'error' | 'warning' | 'info' | 'success'
> = {
  critical: 'error',
  high: 'warning',
  medium: 'warning',
  low: 'success',
};

export function SeverityBadge({ severity }: { severity: ReviewIssue['severity'] }) {
  return (
    <Chip label={severity.toUpperCase()} size="small" color={severityColor[severity]} variant="outlined" />
  );
}

export function IssueCard({
  issue,
  streaming = false,
}: {
  issue: ReviewIssue;
  streaming?: boolean;
}) {
  const explanation = issue.explanation || issue.message;
  const fix = issue.suggestedFix || issue.suggestion;
  const category = issue.category || issue.type;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderColor: streaming ? 'primary.main' : undefined,
        borderWidth: streaming ? 1 : undefined,
        borderStyle: streaming ? 'solid' : undefined,
        opacity: streaming ? 0.95 : 1,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...(streaming && {
          boxShadow: '0 0 0 1px rgba(59,130,246,0.25)',
        }),
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, alignItems: 'center' }}>
        <SeverityBadge severity={issue.severity} />
        <Chip label={category} size="small" variant="outlined" />
        {issue.line !== null && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Line {issue.line}
          </Typography>
        )}
        {streaming && (
          <Chip label="Streaming…" size="small" color="primary" variant="outlined" />
        )}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
        {issue.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {explanation}
      </Typography>
      {issue.evidence && (
        <Box
          sx={{
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(148,163,184,0.06)',
            border: '1px solid rgba(148,163,184,0.15)',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }} gutterBottom>
            Evidence
          </Typography>
          <Typography component="pre" variant="caption" sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {issue.evidence}
          </Typography>
        </Box>
      )}
      {fix && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.2)',
          }}
        >
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, display: 'block' }} gutterBottom>
            Suggested fix
          </Typography>
          <Typography component="pre" variant="caption" sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {fix}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export function LanguageSelect({
  value,
  onChange,
  disabled,
}: {
  value: SupportedLanguage;
  onChange: (value: SupportedLanguage) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }} disabled={disabled}>
      <InputLabel>Language</InputLabel>
      <Select
        value={value}
        label="Language"
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <MenuItem key={language} value={language} sx={{ textTransform: 'capitalize' }}>
            {language}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function PhaseProgress({
  phases,
}: {
  phases: Record<ReviewPhase, 'pending' | 'active' | 'done'>;
}) {
  const total = REVIEW_PHASES.length;
  const doneCount = Object.values(phases).filter((s) => s === 'done').length;
  const activeCount = Object.values(phases).filter((s) => s === 'active').length;

  // Solid progress: only fully-done phases
  const value = (doneCount / total) * 100;
  // Buffer (ghost) progress: done + half credit for active phase — gives a visual "next stop"
  const valueBuffer = ((doneCount + activeCount * 0.5) / total) * 100;
  const hasActive = activeCount > 0;
  const displayPct = Math.round(hasActive ? valueBuffer : value);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Review progress
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {displayPct}%
        </Typography>
      </Box>

      {/* Stack: buffer bar (done → next) + indeterminate shimmer when active */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <LinearProgress
          variant="buffer"
          value={value}
          valueBuffer={valueBuffer}
          sx={{
            borderRadius: 1,
            height: 6,
            transition: 'transform 0.6s ease',
            '& .MuiLinearProgress-bar1Buffer': {
              transition: 'transform 0.6s ease',
            },
            '& .MuiLinearProgress-bar2Buffer': {
              transition: 'transform 0.6s ease',
              opacity: 0.35,
            },
            '& .MuiLinearProgress-dashed': {
              display: 'none',
            },
          }}
        />
        {hasActive && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              borderRadius: 1,
              height: 6,
              opacity: 0.25,
              bgcolor: 'transparent',
            }}
          />
        )}
      </Box>

      {REVIEW_PHASES.map(({ id, label }) => {
        const status = phases[id];
        const isActive = status === 'active';
        const isDone = status === 'done';
        return (
          <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
            {/* Animated dot for active, checkmark for done, hollow for pending */}
            <Box sx={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
              {isActive ? (
                <>
                  {/* Outer pulse ring */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: -2,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      opacity: 0.3,
                      animation: 'ping 1.2s ease-out infinite',
                      '@keyframes ping': {
                        '0%': { transform: 'scale(1)', opacity: 0.35 },
                        '100%': { transform: 'scale(2.2)', opacity: 0 },
                      },
                    }}
                  />
                  {/* Inner solid dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                    }}
                  />
                </>
              ) : (
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: isDone ? 'success.main' : 'action.disabled',
                    transition: 'background-color 0.4s ease',
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                transition: 'color 0.3s ease, font-weight 0.3s ease',
                color: isDone
                  ? 'success.main'
                  : isActive
                    ? 'primary.main'
                    : 'text.disabled',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {label}
              {isActive && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    ml: 0.5,
                    animation: 'ellipsis 1.4s steps(4, end) infinite',
                    '@keyframes ellipsis': {
                      '0%':  { content: '"."' },
                      '33%': { content: '".."' },
                      '66%': { content: '"..."' },
                      '100%':{ content: '"."' },
                    },
                    '&::after': {
                      content: '"..."',
                      animation: 'dots 1.4s steps(4, end) infinite',
                      '@keyframes dots': {
                        '0%':  { content: '"."' },
                        '33%': { content: '".."' },
                        '66%': { content: '"..."' },
                        '100%':{ content: '"."' },
                      },
                    },
                  }}
                />
              )}
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
}


export const StreamingTextPanel = forwardRef<
  HTMLDivElement,
  { text: string; active: boolean }
>(function StreamingTextPanel({ text, active }, ref) {
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Live analysis
        </Typography>
        {active && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'pulse 1.2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }}
          />
        )}
      </Box>
      <Box
        ref={ref}
        sx={{
          maxHeight: 200,
          overflowY: 'auto',
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(2,6,23,0.6)',
          border: '1px solid rgba(148,163,184,0.12)',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          color: 'text.secondary',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text || (active ? 'Starting analysis…' : '')}
        {active && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: '0.5em',
              height: '1em',
              ml: 0.25,
              bgcolor: 'primary.main',
              verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
              '@keyframes blink': {
                '50%': { opacity: 0 },
              },
            }}
          />
        )}
      </Box>
    </Paper>
  );
});

export function TokenUsageBar({ usage }: { usage: TokenUsage | null }) {
  if (!usage) return null;
  const percent = Math.min(100, (usage.monthlyUsed / usage.monthlyBudget) * 100);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2">Token usage</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {usage.monthlyUsed.toLocaleString()} / {usage.monthlyBudget.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent} sx={{ borderRadius: 1, mb: 1 }} />
      <Typography variant="caption" color="text.secondary">
        {usage.inputTokens} in · {usage.outputTokens} out ·{' '}
        {usage.monthlyRemaining.toLocaleString()} remaining
      </Typography>
    </Paper>
  );
}

export function ReviewSummaryCard({
  summary,
  metrics,
}: {
  summary: ReviewSummary | null;
  metrics?: ReviewMetrics | null;
}) {
  if (!summary) return null;
  const scores = metrics ?? summary.metrics;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
        borderColor: 'rgba(59,130,246,0.25)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} color="primary.light">
          Summary
        </Typography>
        <Chip label={`${summary.overallScore}/10`} color="primary" size="small" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: scores ? 2 : 0 }}>
        {summary.summary}
      </Typography>
      {scores && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          {[
            { label: 'Quality', value: scores.codeQualityScore },
            { label: 'Security', value: scores.securityScore },
            { label: 'Maintainability', value: scores.maintainabilityScore },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ textAlign: 'center', p: 1, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export function CleanReviewBanner({
  summary,
  language,
}: {
  summary?: ReviewSummary | null;
  language?: string | null;
}) {
  const score = summary?.overallScore;
  const scoreLabel =
    typeof score === 'number' && score > 0 ? `Score ${score}/10` : null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: 'center',
        borderStyle: 'solid',
        borderColor: 'success.main',
        borderWidth: 1,
        bgcolor: 'rgba(52,211,153,0.08)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.light', mb: 1 }}>
        Your code looks great!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: scoreLabel || language ? 1.5 : 0 }}>
        No confirmed issues were found. Your snippet passed security, quality, and
        maintainability checks.
      </Typography>
      {(scoreLabel || language) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {scoreLabel && (
            <Chip label={scoreLabel} size="small" color="success" variant="outlined" />
          )}
          {language && language !== '—' && (
            <Chip label={language} size="small" color="secondary" variant="outlined" />
          )}
        </Box>
      )}
    </Paper>
  );
}
