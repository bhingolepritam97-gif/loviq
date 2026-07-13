import { StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: 220, // Leave enough space for the sticky footer
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D0D1A',
    marginBottom: Spacing.sm,
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  intentsList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  intentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    position: 'relative',
    overflow: 'hidden',
  },
  intentCardSelected: {
    borderColor: '#FF3A5C',
    backgroundColor: '#FFF9FB',
    ...Shadow.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.lg,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  emojiContainerSelected: {
    backgroundColor: '#FFF5F8',
    borderColor: '#E91E8C',
  },
  emojiText: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: '#0D0D1A',
    marginBottom: Spacing.xs,
  },
  cardTitleSelected: {
    color: '#E91E8C',
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  chevronSelected: {
    color: '#E91E8C',
  },
  selectedBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textMuted,
    fontWeight: '600',
  },
  quoteSparkle: {
    fontSize: 10,
    color: '#E91E8C',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
    ...Shadow.lg,
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  progressStats: {
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D0D1A',
  },
  statsSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  progressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressRingContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '800',
    color: '#E91E8C',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  btn: {
    width: '100%',
    height: 60,
    borderRadius: Radius.lg * 2.5, // 20px
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  btnDisabled: {
    backgroundColor: '#EAEAEA',
    opacity: 0.5,
  },
  btnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  btnTextDisabled: {
    color: Colors.textMuted,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  secureText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  secureIcon: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  headerContainer: {
    width: '100%',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressActive: {
    backgroundColor: '#E91E8C',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    height: 50,
  },
  backIcon: {
    fontSize: 24,
    color: '#0D0D1A',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D0D1A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E91E8C',
    fontWeight: '700',
    marginTop: 2,
  },
});
