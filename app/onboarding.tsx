import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser, LearningPath, ExperienceLevel, LearningGoal } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

const { width, height } = Dimensions.get('window');

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.step, { backgroundColor: colors.background }]}>
      <View style={styles.welcomeContent}>
        <Text style={[styles.welcomeEmoji]}>🙏</Text>
        <Text style={[Typography.h1, { color: colors.primary, textAlign: 'center', marginBottom: Spacing.sm }]}>
          Kurra
        </Text>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
          Learn real Nepali
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.huge, paddingHorizontal: Spacing.xxl }]}>
          Build confidence speaking Nepali with practical lessons, cultural context, and optional script learning.
        </Text>
        <Button title="Get Started" onPress={onNext} size="large" fullWidth />
      </View>
    </View>
  );
}

function PathStep({ onSelect }: { onSelect: (path: LearningPath) => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<LearningPath | null>(null);

  return (
    <View style={[styles.step, { backgroundColor: colors.background }]}>
      <View style={styles.stepContent}>
        <Text style={[Typography.h2, { color: colors.text, marginBottom: Spacing.sm }]}>
          How do you want to learn?
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.xxxl }]}>
          You can change this anytime in settings.
        </Text>

        <TouchableOpacity
          style={[
            styles.pathCard,
            {
              backgroundColor: selected === 'speaking' ? colors.primary + '15' : colors.surface,
              borderColor: selected === 'speaking' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelected('speaking')}
          activeOpacity={0.7}
        >
          <Text style={styles.pathEmoji}>🗣️</Text>
          <View style={styles.pathTextContainer}>
            <Text style={[Typography.h4, { color: colors.text }]}>Speaking Only</Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
              Learn to speak and understand Nepali using English, romanized text, and audio. No script needed.
            </Text>
          </View>
          <View
            style={[
              styles.radio,
              {
                borderColor: selected === 'speaking' ? colors.primary : colors.border,
                backgroundColor: selected === 'speaking' ? colors.primary : 'transparent',
              },
            ]}
          >
            {selected === 'speaking' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pathCard,
            {
              backgroundColor: selected === 'speaking_script' ? colors.secondary + '15' : colors.surface,
              borderColor: selected === 'speaking_script' ? colors.secondary : colors.border,
            },
          ]}
          onPress={() => setSelected('speaking_script')}
          activeOpacity={0.7}
        >
          <Text style={styles.pathEmoji}>📖</Text>
          <View style={styles.pathTextContainer}>
            <Text style={[Typography.h4, { color: colors.text }]}>Speaking + Script</Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
              Learn to speak AND read Devanagari. Build reading skills step by step alongside conversation.
            </Text>
          </View>
          <View
            style={[
              styles.radio,
              {
                borderColor: selected === 'speaking_script' ? colors.secondary : colors.border,
                backgroundColor: selected === 'speaking_script' ? colors.secondary : 'transparent',
              },
            ]}
          >
            {selected === 'speaking_script' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomAction}>
        <Button
          title="Continue"
          onPress={() => selected && onSelect(selected)}
          disabled={!selected}
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

function ExperienceStep({ onSelect }: { onSelect: (exp: ExperienceLevel) => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<ExperienceLevel | null>(null);

  return (
    <View style={[styles.step, { backgroundColor: colors.background }]}>
      <View style={styles.stepContent}>
        <Text style={[Typography.h2, { color: colors.text, marginBottom: Spacing.sm }]}>
          What's your level?
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.xxxl }]}>
          This helps us tailor your experience.
        </Text>

        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: selected === 'beginner' ? colors.primary + '15' : colors.surface,
              borderColor: selected === 'beginner' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelected('beginner')}
          activeOpacity={0.7}
        >
          <Text style={styles.pathEmoji}>🌱</Text>
          <View style={styles.pathTextContainer}>
            <Text style={[Typography.h4, { color: colors.text }]}>Complete Beginner</Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
              I don't know any Nepali yet
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            {
              backgroundColor: selected === 'some_knowledge' ? colors.primary + '15' : colors.surface,
              borderColor: selected === 'some_knowledge' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelected('some_knowledge')}
          activeOpacity={0.7}
        >
          <Text style={styles.pathEmoji}>🌿</Text>
          <View style={styles.pathTextContainer}>
            <Text style={[Typography.h4, { color: colors.text }]}>I Know a Little</Text>
            <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
              I've heard Nepali at home or picked up some phrases
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomAction}>
        <Button
          title="Continue"
          onPress={() => selected && onSelect(selected)}
          disabled={!selected}
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

function GoalStep({ onSelect }: { onSelect: (goals: LearningGoal[]) => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<LearningGoal[]>([]);

  const toggle = (goal: LearningGoal) => {
    setSelected((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const goals: { id: LearningGoal; emoji: string; label: string }[] = [
    { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Talk with family' },
    { id: 'travel', emoji: '✈️', label: 'Travel to Nepal' },
    { id: 'conversation', emoji: '💬', label: 'Have conversations' },
    { id: 'culture', emoji: '🎭', label: 'Understand the culture' },
  ];

  return (
    <View style={[styles.step, { backgroundColor: colors.background }]}>
      <View style={styles.stepContent}>
        <Text style={[Typography.h2, { color: colors.text, marginBottom: Spacing.sm }]}>
          What's your goal?
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.xxxl }]}>
          Pick one or more. This helps personalize your journey.
        </Text>

        {goals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalChip,
              {
                backgroundColor: selected.includes(goal.id) ? colors.primary + '15' : colors.surface,
                borderColor: selected.includes(goal.id) ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggle(goal.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
            <Text style={[Typography.bodyBold, { color: colors.text }]}>{goal.label}</Text>
            {selected.includes(goal.id) && (
              <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomAction}>
        <Button
          title="Start Learning"
          onPress={() => onSelect(selected.length > 0 ? selected : ['conversation'])}
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { updateProfile } = useUser();
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<LearningPath>('speaking');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');

  const handlePathSelect = (selectedPath: LearningPath) => {
    setPath(selectedPath);
    setStep(2);
  };

  const handleExperienceSelect = (exp: ExperienceLevel) => {
    setExperience(exp);
    setStep(3);
  };

  const handleGoalSelect = async (goals: LearningGoal[]) => {
    await updateProfile({
      hasOnboarded: true,
      path,
      experience,
      goals,
    });
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#2D2A26' ? 'dark-content' : 'light-content'} />
      {step > 0 && (
        <View style={styles.progressDots}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.dot,
                {
                  backgroundColor: step >= s ? colors.primary : colors.border,
                  width: step === s ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <PathStep onSelect={handlePathSelect} />}
      {step === 2 && <ExperienceStep onSelect={handleExperienceSelect} />}
      {step === 3 && <GoalStep onSelect={handleGoalSelect} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  welcomeEmoji: {
    fontSize: 72,
    marginBottom: Spacing.xxl,
  },
  stepContent: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  pathEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  pathTextContainer: {
    flex: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  goalEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  bottomAction: {
    paddingBottom: Spacing.huge,
  },
});
