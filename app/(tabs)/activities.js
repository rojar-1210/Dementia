import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { logActivity } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

// ── Memory Match Game ──────────────────────────────────────
const CARD_EMOJIS = ['🍎', '🐶', '🌸', '⭐', '🎵', '🏠'];
const INITIAL_CARDS = [...CARD_EMOJIS, ...CARD_EMOJIS]
  .sort(() => Math.random() - 0.5)
  .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));

function MemoryGame({ onComplete }) {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);

  const flip = (card) => {
    if (card.flipped || card.matched || selected.length === 2) return;
    const newCards = cards.map((c) => c.id === card.id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, card];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      if (newSelected[0].emoji === newSelected[1].emoji) {
        const matched = newCards.map((c) =>
          c.emoji === newSelected[0].emoji ? { ...c, matched: true } : c
        );
        setCards(matched);
        setSelected([]);
        if (matched.every((c) => c.matched)) onComplete(moves + 1);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newSelected.find((s) => s.id === c.id) && !c.matched ? { ...c, flipped: false } : c
            )
          );
          setSelected([]);
        }, 900);
      }
    }
  };

  return (
    <View>
      <Text style={styles.gameInfo}>Moves: {moves}</Text>
      <View style={styles.cardGrid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.memCard, card.matched && styles.memCardMatched]}
            onPress={() => flip(card)}
          >
            <Text style={styles.memEmoji}>
              {card.flipped || card.matched ? card.emoji : '❓'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Number Sequence Game ───────────────────────────────────
function NumberSequence({ onComplete }) {
  const [sequence] = useState(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1));
  const [input, setInput] = useState([]);
  const [phase, setPhase] = useState('show'); // 'show' | 'input'

  const handleInput = (n) => {
    const next = [...input, n];
    setInput(next);
    if (next.length === sequence.length) {
      const correct = next.every((v, i) => v === sequence[i]);
      if (correct) onComplete();
      else Alert.alert('Try Again', `Correct: ${sequence.join(' → ')}`, [{ text: 'OK', onPress: () => setInput([]) }]);
    }
  };

  return (
    <View style={styles.seqContainer}>
      {phase === 'show' ? (
        <>
          <Text style={styles.seqTitle}>Remember this sequence:</Text>
          <View style={styles.seqRow}>
            {sequence.map((n, i) => (
              <View key={i} style={styles.seqBadge}><Text style={styles.seqNum}>{n}</Text></View>
            ))}
          </View>
          <TouchableOpacity style={styles.seqBtn} onPress={() => setPhase('input')}>
            <Text style={styles.seqBtnText}>I'm Ready!</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.seqTitle}>Enter the sequence:</Text>
          <View style={styles.seqRow}>
            {input.map((n, i) => (
              <View key={i} style={[styles.seqBadge, { backgroundColor: COLORS.success }]}>
                <Text style={styles.seqNum}>{n}</Text>
              </View>
            ))}
          </View>
          <View style={styles.numPad}>
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <TouchableOpacity key={n} style={styles.numBtn} onPress={() => handleInput(n)}>
                <Text style={styles.numBtnText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── Main Activities Screen ─────────────────────────────────
const ACTIVITIES = [
  { key: 'memory', label: 'Memory Match', emoji: '🃏', desc: 'Match pairs of cards' },
  { key: 'sequence', label: 'Number Sequence', emoji: '🔢', desc: 'Remember and repeat numbers' },
  { key: 'breathing', label: 'Breathing Exercise', emoji: '🌬️', desc: 'Calm your mind' },
];

export default function ActivitiesScreen() {
  const { user } = useAuth();
  const [active, setActive] = useState(null);

  const handleComplete = async (label, score) => {
    await logActivity(user.uid, `Completed ${label}${score ? ` in ${score} moves` : ''}`);
    Alert.alert('🎉 Great Job!', `You completed ${label}!`, [{ text: 'Done', onPress: () => setActive(null) }]);
  };

  if (active === 'memory') {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActive(null)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>🃏 Memory Match</Text>
        <MemoryGame onComplete={(moves) => handleComplete('Memory Match', moves)} />
      </ScrollView>
    );
  }

  if (active === 'sequence') {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActive(null)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>🔢 Number Sequence</Text>
        <NumberSequence onComplete={() => handleComplete('Number Sequence')} />
      </ScrollView>
    );
  }

  if (active === 'breathing') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setActive(null)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 80 }}>🌬️</Text>
        <Text style={styles.gameTitle}>Breathe In... Breathe Out</Text>
        <Text style={styles.breathText}>Inhale for 4 seconds{'\n'}Hold for 4 seconds{'\n'}Exhale for 6 seconds</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => handleComplete('Breathing Exercise')}>
          <Text style={styles.doneBtnText}>Done ✓</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧩 Activities</Text>
      </View>
      <Text style={styles.sectionLabel}>Choose an activity to keep your mind sharp:</Text>
      {ACTIVITIES.map((a) => (
        <TouchableOpacity key={a.key} style={styles.actCard} onPress={() => setActive(a.key)}>
          <Text style={styles.actEmoji}>{a.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>{a.label}</Text>
            <Text style={styles.actDesc}>{a.desc}</Text>
          </View>
          <Text style={{ fontSize: 22, color: COLORS.subtext }}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sectionLabel: { fontSize: FONTS.medium, color: COLORS.subtext, padding: SPACING.lg, paddingBottom: SPACING.sm },
  actCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md,
    padding: SPACING.md, elevation: 2,
  },
  actEmoji: { fontSize: 40, marginRight: SPACING.md },
  actTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  actDesc: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  backBtn: { padding: SPACING.lg, paddingBottom: 0 },
  backText: { fontSize: FONTS.medium, color: COLORS.primary, fontWeight: '600' },
  gameTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, padding: SPACING.lg, paddingBottom: SPACING.sm },
  gameInfo: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.md, gap: SPACING.sm, justifyContent: 'center' },
  memCard: {
    width: 80, height: 80, borderRadius: RADIUS.md, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  memCardMatched: { backgroundColor: '#E8F5E9' },
  memEmoji: { fontSize: 36 },
  seqContainer: { padding: SPACING.lg, alignItems: 'center' },
  seqTitle: { fontSize: FONTS.large, color: COLORS.text, marginBottom: SPACING.md, textAlign: 'center' },
  seqRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  seqBadge: { width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  seqNum: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  seqBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  seqBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  numPad: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginTop: SPACING.md },
  numBtn: { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  numBtnText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  breathText: { fontSize: FONTS.large, color: COLORS.text, textAlign: 'center', lineHeight: 40, marginVertical: SPACING.lg },
  doneBtn: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  doneBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});
