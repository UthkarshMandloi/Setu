export function calculateEligibilityScore(documentVerdicts: { type: string, verdict: string }[]) {
  // Weights: Incorporation 20%, DPIIT 25%, PAN 15%, GST 15%, Financials 15%, Other 10%
  const weights = {
    INCORPORATION: 20,
    DPIIT: 25,
    PAN: 15,
    GST: 15,
    FINANCIALS: 15,
    OTHER: 10
  };

  let score = 0;
  let hasRejection = false;
  let hasNeedsReview = false;

  for (const doc of documentVerdicts) {
    if (doc.verdict === 'VERIFIED') {
      score += weights[doc.type as keyof typeof weights] || 0;
    } else if (doc.verdict === 'NEEDS_REVIEW') {
      score += (weights[doc.type as keyof typeof weights] || 0) * 0.5; // partial score
      hasNeedsReview = true;
    } else if (doc.verdict === 'REJECTED') {
      hasRejection = true;
    }
  }

  // Cap at 100
  score = Math.min(100, Math.round(score));

  let finalStatus = 'PENDING';
  if (score >= 80 && !hasRejection) {
    finalStatus = 'VERIFIED';
  } else if (score >= 50 && !hasRejection) {
    finalStatus = 'NEEDS_REVIEW';
  } else {
    finalStatus = 'REJECTED';
  }
  
  if (hasRejection && finalStatus === 'VERIFIED') {
      finalStatus = 'NEEDS_REVIEW' // downgrade if high score but a rejection exists
  }
  
  if (documentVerdicts.length === 0) finalStatus = 'PENDING';

  return { score, status: finalStatus };
}
