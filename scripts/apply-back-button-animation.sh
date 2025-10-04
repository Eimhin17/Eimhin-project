#!/bin/bash

# Script to apply consistent back button animation pattern to onboarding files

FILES=(
  "community-guidelines.tsx"
  "dating-intentions.tsx"
  "debs-preferences.tsx"
  "gender-preference.tsx"
  "legal-agreements.tsx"
  "looking-for.tsx"
  "mascot-intro.tsx"
  "mascot-phase2.tsx"
  "mascot-phase3.tsx"
  "mascot-phase4.tsx"
  "profile-prompts.tsx"
  "relationship-status.tsx"
)

cd "/Users/gregoryohare/Desktop/DebsMatch/app/(onboarding)"

for file in "${FILES[@]}"; do
  echo "Processing $file..."

  # Check if file exists and has BackButton
  if [[ -f "$file" ]] && grep -q "BackButton" "$file"; then
    echo "  - Updating $file"

    # Add playLightHaptic import if not already present
    if ! grep -q "playLightHaptic" "$file"; then
      # Add to existing haptics import line or create new one
      if grep -q "import.*haptics" "$file"; then
        sed -i.bak "s/import { \([^}]*\) } from '..\/..\/utils\/haptics';/import { \1, playLightHaptic } from '..\/..\/utils\/haptics';/" "$file"
      else
        # Add after last import line
        sed -i.bak "/^import/a\\
import { playLightHaptic } from '../../utils/haptics';" "$file"
      fi
    fi

    # Update backButtonScale initialization
    sed -i.bak "s/const backButtonScale = useRef(new Animated.Value(1)).current;/const backButtonScale = useRef(new Animated.Value(0.8)).current;\\
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;/" "$file"

    echo "  - Applied basic changes to $file"
  else
    echo "  - Skipping $file (not found or no BackButton)"
  fi
done

echo "Script completed. Remember to manually update useEffect and handleBackPress functions."
