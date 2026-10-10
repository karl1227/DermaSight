import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { AppButton } from '../components/AppButton';
import {
  prepareCapture,
  type PreparedCapture,
} from '../services/capturePreparationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ConfirmImage'>;
  route: RouteProp<RootStackParamList, 'ConfirmImage'>;
};

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - Spacing.xl * 2;

export const ConfirmImageScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    patientInfo,
    symptoms,
    imageUri,
    imagePath,
    imageData,
    imageType,
    imageMeta,
    imageEntry,
  } = route.params;
  const [prepared, setPrepared] = React.useState<PreparedCapture | null>(null);
  const [stage, setStage] = React.useState('Preparing image');
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [isPreparing, setIsPreparing] = React.useState(true);
  const [zoom, setZoom] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<'crop' | 'highlight'>('crop');

  React.useEffect(() => {
    let active = true;
    setIsPreparing(true);
    setPrepared(null);
    setError(null);
    const interaction = InteractionManager.runAfterInteractions(() => {
      prepareCapture(
        {
          base64: imageData,
          mimeType: imageType,
          filePath: imagePath ?? imageUri,
        },
        imageMeta,
        value => {
          if (active) setStage(value);
        },
        () => !active,
        zoom,
      )
        .then(value => {
          if (active) setPrepared(value);
        })
        .catch(reason => {
          if (active)
            setError(
              reason instanceof Error
                ? reason.message
                : 'Image checking failed. Please retake the photo.',
            );
        })
        .finally(() => {
          if (active) setIsPreparing(false);
        });
    });
    return () => {
      active = false;
      interaction.cancel();
    };
  }, [imageData, imageMeta, imagePath, imageType, imageUri, attempt, zoom]);

  const original = prepared?.originalImage;
  const bounds = prepared?.lesionBounds;
  const showOriginal = viewMode === 'highlight' && Boolean(original);
  const fit = original
    ? Math.min(IMAGE_SIZE / original.width, IMAGE_SIZE / original.height)
    : 1;
  const originalWidth = (original?.width ?? IMAGE_SIZE) * fit;
  const originalHeight = (original?.height ?? IMAGE_SIZE) * fit;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>
            {imageEntry === 'gallery' ? '‹ Back' : '‹ Retake'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {imageEntry === 'gallery'
            ? 'Review Uploaded Image'
            : 'Review Captured Image'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Patient Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient</Text>
            <Text style={styles.infoValue}>{patientInfo.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Screening ID</Text>
            <Text style={styles.infoValue}>{patientInfo.patientId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{patientInfo.lesionLocation}</Text>
          </View>
        </View>

        {/* Image preview; quality and automatic cropping still run locally. */}
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: showOriginal
                ? original!.uri
                : prepared?.image.uri ?? imageUri,
            }}
            style={styles.image}
            resizeMode="contain"
          />
          {showOriginal && bounds && (
            <View
              pointerEvents="none"
              style={[
                styles.lesionHighlight,
                {
                  left:
                    (IMAGE_SIZE - originalWidth) / 2 +
                    bounds.left * originalWidth,
                  top:
                    (IMAGE_SIZE - originalHeight) / 2 +
                    bounds.top * originalHeight,
                  width: (bounds.right - bounds.left) * originalWidth,
                  height: (bounds.bottom - bounds.top) * originalHeight,
                },
              ]}
            />
          )}
          {isPreparing && (
            <View
              style={styles.loadingOverlay}
              accessibilityRole="progressbar"
              accessibilityLabel="Checking image"
            >
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}
        </View>

        {prepared?.cropped && original && !isPreparing && (
          <View style={styles.previewModes}>
            <AppButton
              label={bounds ? 'Lesion Highlight' : 'Original Image'}
              variant={showOriginal ? 'primary' : 'outline'}
              size="sm"
              fullWidth={false}
              onPress={() => setViewMode('highlight')}
            />
            <AppButton
              label="Selected ROI"
              variant={showOriginal ? 'outline' : 'primary'}
              size="sm"
              fullWidth={false}
              onPress={() => setViewMode('crop')}
            />
          </View>
        )}

        {isPreparing ? (
          <Text style={styles.unavailableText} accessibilityLiveRegion="polite">
            {stage}…
          </Text>
        ) : error ? (
          <View style={styles.retakeSuggestion} accessibilityRole="alert">
            <Text style={styles.retakeSuggestionText}>{error}</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        {prepared &&
          prepared.validationMethod === 'appearance' &&
          !isPreparing && (
            <Text style={styles.unavailableText} accessibilityRole="alert">
              Confirm that the preview shows skin and the intended lesion before
              analyzing it.
            </Text>
          )}
        {prepared && !isPreparing && (
          <View style={styles.zoomControls}>
            <AppButton
              label="Zoom Out"
              variant="outline"
              fullWidth={false}
              disabled={zoom <= 1}
              onPress={() => setZoom(value => Math.max(1, value - 0.25))}
            />
            <AppButton
              label="Zoom In"
              variant="outline"
              fullWidth={false}
              disabled={zoom + 0.25 > prepared.maxZoom}
              onPress={() => setZoom(value => value + 0.25)}
            />
          </View>
        )}
        <AppButton
          label="Analyze Image"
          onPress={() => {
            if (!prepared || isPreparing || error) return;
            navigation.replace('AIClassification', {
              patientInfo,
              symptoms,
              imageUri: prepared.image.uri,
              imagePath: prepared.image.path,
              imageType: 'image/jpeg',
              preprocessingId: prepared.preprocessing.id,
            });
          }}
          size="lg"
          disabled={!prepared || isPreparing || Boolean(error)}
          loading={isPreparing}
          style={styles.proceedBtn}
        />
        {error && (
          <AppButton
            label="Retry Check"
            onPress={() => setAttempt(value => value + 1)}
            variant="outline"
            style={styles.proceedBtn}
          />
        )}

        <AppButton
          label={
            imageEntry === 'gallery'
              ? 'Back to Camera / Gallery'
              : 'Retake Image'
          }
          onPress={() => navigation.goBack()}
          variant="outline"
          size="lg"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.medium,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  imageWrapper: {
    position: 'relative',
    marginBottom: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Radius.xl,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
    lineHeight: 20,
  },
  retakeSuggestion: {
    marginBottom: Spacing.base,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.32)',
  },
  retakeSuggestionText: {
    fontSize: Typography.xs,
    color: '#92400E',
    lineHeight: Typography.xs * 1.45,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  infoTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginRight: Spacing.md,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  proceedBtn: { marginBottom: Spacing.md },
  lesionHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0, 201, 177, 0.15)',
    borderRadius: Radius.sm,
  },
  previewModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
