import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [visible, setVisible] = useState(false);
  const [hour, minute] = value.split(':');

  const selectTime = (h: string, m: string) => {
    onChange(`${h}:${m}`);
    setVisible(false);
  };

  const formatDisplay = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.time}>{formatDisplay(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray500} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Time</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeGrid} showsVerticalScrollIndicator={false}>
              {HOURS.map(h => (
                <View key={h} style={styles.hourRow}>
                  {MINUTES.map(m => {
                    const time = `${h}:${m}`;
                    const isSelected = value === time;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                        onPress={() => selectTime(h, m)}
                      >
                        <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                          {formatDisplay(time)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  label: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  time: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  timeGrid: {
    padding: spacing.md,
  },
  hourRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timeOption: {
    flex: 1,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
  },
  timeText: {
    ...textStyles.labelSmall,
    color: colors.textPrimary,
  },
  timeTextSelected: {
    color: colors.black,
  },
});
