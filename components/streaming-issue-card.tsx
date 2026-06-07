'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ReviewIssue } from '@/lib/types';
import { SeverityBadge } from '@/components/review-ui';

const CHAR_MS = 14;

function useTypewriter(text: string, active: boolean, onDone?: () => void) {
  const [value, setValue] = useState(active ? '' : text);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setValue(text);
      return;
    }
    if (!text) {
      setValue('');
      onDoneRef.current?.();
      return;
    }

    setValue('');
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, CHAR_MS);

    return () => clearInterval(timer);
  }, [text, active]);

  return value;
}

function Cursor() {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: '0.45em',
        height: '1em',
        ml: 0.25,
        bgcolor: 'primary.main',
        verticalAlign: 'text-bottom',
        animation: 'streamBlink 1s step-end infinite',
        '@keyframes streamBlink': { '50%': { opacity: 0 } },
      }}
    />
  );
}

export function StreamingIssueCard({
  issue,
  onComplete,
}: {
  issue: ReviewIssue;
  onComplete: () => void;
}) {
  const explanation = issue.explanation || issue.message;
  const fix = issue.suggestedFix || issue.suggestion;
  const category = issue.category || issue.type;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [stage, setStage] = useState(0);
  const finishedRef = useRef(false);

  const advanceFromExplanation = () => {
    if (issue.evidence) setStage(1);
    else if (fix) setStage(2);
    else setStage(3);
  };

  const advanceFromEvidence = () => {
    if (fix) setStage(2);
    else setStage(3);
  };

  const typedExplanation = useTypewriter(
    explanation,
    stage === 0,
    advanceFromExplanation,
  );
  const typedEvidence = useTypewriter(issue.evidence, stage === 1, advanceFromEvidence);
  const typedFix = useTypewriter(fix, stage === 2, () => setStage(3));

  useEffect(() => {
    if (stage === 3 && !finishedRef.current) {
      finishedRef.current = true;
      onCompleteRef.current();
    }
  }, [stage]);

  const showCursor =
    stage < 3 &&
    ((stage === 0 && typedExplanation.length < explanation.length) ||
      (stage === 1 && typedEvidence.length < issue.evidence.length) ||
      (stage === 2 && typedFix.length < fix.length));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'primary.main',
        boxShadow: '0 0 0 1px rgba(59,130,246,0.25)',
        animation: 'issueFadeIn 0.35s ease-out',
        '@keyframes issueFadeIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, alignItems: 'center' }}>
        <SeverityBadge severity={issue.severity} />
        <Chip label={category} size="small" variant="outlined" />
        {issue.line !== null && (
          <Typography variant="caption" color="text.secondary">
            Line {issue.line}
          </Typography>
        )}
        <Chip label="Streaming…" size="small" color="primary" variant="outlined" />
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
        {issue.title}
      </Typography>

      {(explanation || stage === 0) && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {typedExplanation}
          {stage === 0 && showCursor && <Cursor />}
        </Typography>
      )}

      {issue.evidence && stage >= 1 && (
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
            {typedEvidence}
            {stage === 1 && showCursor && <Cursor />}
          </Typography>
        </Box>
      )}

      {fix && stage >= 2 && (
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
            {typedFix}
            {stage === 2 && showCursor && <Cursor />}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
