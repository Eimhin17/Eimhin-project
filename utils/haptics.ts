import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';

export const playOnboardingProgressHaptic = (currentStep: number, totalSteps: number) => {
  try {
    const normalizedTotal = Math.max(totalSteps, 1);
    const basePercentage = ((currentStep - 1) / normalizedTotal) * 100;
    const targetPercentage = (currentStep / normalizedTotal) * 100;

    if (currentStep >= totalSteps) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 120);
      setTimeout(() => {
        Haptics.selectionAsync().catch(() => {});
      }, 260);
      return;
    }

    if (basePercentage < 50 && targetPercentage >= 50) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch (error) {
    console.warn('Haptics playback failed:', error);
  }
};

export const playCardSelectionHaptic = (action: 'add' | 'remove' = 'add') => {
  try {
    if (action === 'remove') {
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 90);
  } catch (error) {
    console.warn('Haptics playback failed:', error);
  }
};

export const attachProgressHaptics = (
  animatedValue: Animated.Value,
  options?: {
    thresholds?: number[];
  }
) => {
  if (!animatedValue) {
    return () => {};
  }

  const thresholds = options?.thresholds ?? [
    0.1,
    0.2,
    0.3,
    0.4,
    0.5,
    0.6,
    0.7,
    0.8,
    0.9,
  ];
  const fired = new Set<number>();

  const listenerId = animatedValue.addListener(({ value }) => {
    thresholds.forEach((threshold) => {
      if (!fired.has(threshold) && value >= threshold) {
        fired.add(threshold);
        let intensity: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light;
        if (threshold >= 0.8) {
          intensity = Haptics.ImpactFeedbackStyle.Heavy;
        } else if (threshold >= 0.5) {
          intensity = Haptics.ImpactFeedbackStyle.Medium;
        }
        Haptics.impactAsync(intensity).catch(() => {});
      }
    });
  });

  return () => {
    animatedValue.removeListener(listenerId);
  };
};

export const playLightHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch (error) {
    console.warn('Haptics playback failed:', error);
  }
};

export const playLevelUpCelebrationHaptic = () => {
  try {
    // Initial success notification
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Heavy impact for the trophy bounce
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 200);

    // Medium impact for the scale animation
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 300);

    // Selection feedback for the rotation
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 450);

    // Final celebration burst
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 600);
  } catch (error) {
    console.warn('Celebration haptics playback failed:', error);
  }
};

export const playProgressCompletionHaptic = () => {
  try {
    // Initial burst - progress complete!
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Escalating celebration sequence
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 150);

    // Double tap celebration
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 250);

    // Selection for sparkle effect
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 400);

    // Medium pulse for glow
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 550);

    // Final triumphant burst
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 700);

    // Bonus celebration tap
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 850);
  } catch (error) {
    console.warn('Progress completion haptics playback failed:', error);
  }
};

export const playPhase3CompletionHaptic = () => {
  try {
    // MASSIVE initial celebration burst
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Triple heavy impact for the overlay appearance
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 100);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 200);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 300);

    // Text scale animation haptics
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 500);

    // Ripple effects with escalating intensity
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 700);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 850);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 1000);

    // Glow effect pulses
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 1200);

    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 1400);

    // Final explosive celebration sequence
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 1600);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 1750);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 1900);

    // Triumphant finale
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 2100);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 2250);

    // Bonus victory burst
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 2400);
  } catch (error) {
    console.warn('Phase 3 completion haptics playback failed:', error);
  }
};

export const playConfettiCelebrationHaptic = () => {
  try {
    // Instant gratification burst - maximum dopamine hit
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Rapid fire excitement builders
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 80);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 160);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 240);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 320);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 400);

    // Escalating celebration sequence
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 520);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 640);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 760);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 880);

    // Peak euphoria moments
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 1000);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 1120);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 1240);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 1360);

    // Satisfying conclusion wave
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 1500);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 1650);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 1800);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 1950);

    // Final dopamine burst
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 2100);
  } catch (error) {
    console.warn('Confetti celebration haptics failed:', error);
  }
};

export const playJoyfulButtonPressHaptic = () => {
  try {
    // Initial satisfying impact
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Quick bounce effect
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 60);

    // Joyful completion
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 150);
  } catch (error) {
    console.warn('Joyful button press haptics failed:', error);
  }
};

export const playTabSelectionHaptic = () => {
  try {
    // Immediate satisfying impact for the press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Medium bounce for the scale up
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 100);

    // Selection feedback for the bounce
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 200);

    // Light tap for the settling
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 350);
  } catch (error) {
    console.warn('Tab selection haptics failed:', error);
  }
};

export const playResetFiltersHaptic = () => {
  try {
    // Initial reset button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Circular motion haptics during rotation
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 150);

    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 300);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 450);

    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 600);

    // Success celebration when popup appears
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 600);

    // Final confirmation tap
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 750);
  } catch (error) {
    console.warn('Reset filters haptics failed:', error);
  }
};

export const playLikeSwipeSuccessHaptic = () => {
  try {
    // Immediate dopamine hit - love at first sight!
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Heart flutter sequence
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 120);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 240);

    // Selection for the heart bounce
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 360);

    // Satisfying completion burst
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 500);

    // Gentle trailing happiness
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 700);

    // Final joy tap
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 900);
  } catch (error) {
    console.warn('Like swipe success haptics failed:', error);
  }
};

export const playDislikeSwipeSuccessHaptic = () => {
  try {
    // Strong but not harsh initial feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Decisive follow-up
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 150);

    // Clean selection feedback
    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 300);

    // Confident completion
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 450);

    // Gentle finish - not too harsh
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 600);
  } catch (error) {
    console.warn('Dislike swipe success haptics failed:', error);
  }
};

export const playMatchCelebrationHaptic = () => {
  try {
    // MASSIVE initial explosion - THE MOMENT!
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Triple explosive burst sequence
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 100);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 180);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 260);

    // Heart flutter celebration
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 380);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 480);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 580);

    // Escalating euphoria wave
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 700);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 820);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 940);

    // Sparkle burst sequence
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 1060);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 1180);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 1300);

    // Profile picture bounce
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 1450);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 1550);

    // Heart pulse waves
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 1700);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 1850);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 2000);

    // Triumphant finale crescendo
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 2150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 2280);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 2410);

    // Victory celebration burst
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 2600);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 2750);
  } catch (error) {
    console.warn('Match celebration haptics failed:', error);
  }
};
