import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

export type ModalVariant = 'info' | 'success' | 'warning' | 'danger' | 'confirm';

export interface ModalButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: ModalVariant;
  buttons: ModalButton[];
  onDismiss?: () => void;
}

const VARIANT_CONFIG: Record<
  ModalVariant,
  { accent: string; iconBg: string; icon: string }
> = {
  info: {
    accent: Colors.primary,
    iconBg: Colors.primaryUltraLight,
    icon: 'ℹ',
  },
  success: {
    accent: Colors.success,
    iconBg: Colors.successLight,
    icon: '✓',
  },
  warning: {
    accent: Colors.warning,
    iconBg: Colors.warningLight,
    icon: '!',
  },
  danger: {
    accent: Colors.danger,
    iconBg: Colors.dangerLight,
    icon: '✕',
  },
  confirm: {
    accent: Colors.primary,
    iconBg: Colors.primaryUltraLight,
    icon: '?',
  },
};

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  title,
  message,
  variant = 'info',
  buttons,
  onDismiss,
}) => {
  const config = VARIANT_CONFIG[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Top accent bar */}
              <View style={[styles.accentBar, { backgroundColor: config.accent }]} />

              <View style={styles.body}>
                {/* Icon */}
                <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
                  <Text style={[styles.iconText, { color: config.accent }]}>
                    {config.icon}
                  </Text>
                </View>

                {/* Text */}
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Buttons */}
                <View
                  style={[
                    styles.buttonsRow,
                    buttons.length === 1 && styles.buttonsRowCenter,
                  ]}>
                  {buttons.map((btn, idx) => {
                    const isDestructive = btn.variant === 'danger';
                    const isOutline = btn.variant === 'outline';
                    const isGhost = btn.variant === 'ghost';
                    const isPrimary =
                      !isDestructive && !isOutline && !isGhost;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.btn,
                          buttons.length > 1 && styles.btnFlex,
                          isPrimary && {
                            backgroundColor: config.accent,
                          },
                          isDestructive && styles.btnDanger,
                          isOutline && [
                            styles.btnOutline,
                            { borderColor: config.accent },
                          ],
                          isGhost && styles.btnGhost,
                        ]}
                        onPress={btn.onPress}
                        activeOpacity={0.8}>
                        <Text
                          style={[
                            styles.btnText,
                            isPrimary && styles.btnTextPrimary,
                            isDestructive && styles.btnTextPrimary,
                            isOutline && { color: config.accent },
                            isGhost && { color: Colors.textMuted },
                          ]}>
                          {btn.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 40, 38, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    width: '100%',
    overflow: 'hidden',
    ...Shadow.lg,
  },
  accentBar: {
    height: 5,
    width: '100%',
  },
  body: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  iconText: {
    fontSize: 22,
    fontWeight: Typography.extraBold,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.55,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    width: '100%',
    marginTop: Spacing.xl,
    marginBottom: Spacing.base,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  buttonsRowCenter: {
    justifyContent: 'center',
  },
  btn: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  btnFlex: {
    flex: 1,
  },
  btnDanger: {
    backgroundColor: Colors.danger,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  btnGhost: {
    backgroundColor: Colors.surfaceAlt,
  },
  btnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  btnTextPrimary: {
    color: Colors.white,
  },
});
