export const ONBOARDING_STEPS = [
  'auth',
  'basic_info',
  'preferences',
  'interests',
  'photo_upload',
  'discover_reached',
];

export function trackOnboardingStep(stepName, extra = {}) {
  console.log('[Analytics] onboarding_step_viewed:', {
    step: stepName,
    step_index: ONBOARDING_STEPS.indexOf(stepName),
    total_steps: ONBOARDING_STEPS.length,
    ...extra,
  });
}

export function trackOnboardingStepCompleted(stepName, timeSpentMs) {
  console.log('[Analytics] onboarding_step_completed:', {
    step: stepName,
    time_spent_ms: timeSpentMs,
  });
}

export function trackOnboardingAbandoned(stepName) {
  console.log('[Analytics] onboarding_abandoned:', { step: stepName });
}

export function trackOnboardingComplete(totalTimeMs) {
  console.log('[Analytics] onboarding_completed:', { total_time_ms: totalTimeMs });
}
