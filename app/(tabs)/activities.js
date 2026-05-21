import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { logActivity } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

// ── Memory Match ───────────────────────────────────────────
const EMOJIS = ['🍎', '🐶', '🌸', '⭐', '🎵', '🏠', '🌈', '🐱'];
function makeCards() {
  return [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

function MemoryGame({ onComplete, onBack }) {
  const [cards, setCards] = useState(makeCards);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);

  const flip = (card) => {
    if (card.flipped || card.matched || selected.length === 2) return;
    const updated = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c);
    const newSel = [...selected, card];
    setCards(updated); setSelected(newSel);
    if (newSel.length === 2) {
      setMoves(m => m + 1);
      if (newSel[0].emoji === newSel[1].emoji) {
        const matched = updated.map(c => c.emoji === newSel[0].emoji ? { ...c, matched: true } : c);
        setCards(matched); setSelected([]);
        if (matched.every(c => c.matched)) onComplete(moves + 1);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newSel.find(s => s.id === c.id) && !c.matched ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 900);
      }
    }
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>🃏 Memory Match</Text>
      <Text style={styles.gameInfo}>Moves: {moves}  •  Matched: {cards.filter(c => c.matched).length / 2}/{EMOJIS.length}</Text>
      <View style={styles.cardGrid}>
        {cards.map(card => (
          <TouchableOpacity key={card.id} style={[styles.memCard, card.matched && styles.memMatched]} onPress={() => flip(card)} activeOpacity={0.8}>
            <Text style={styles.memEmoji}>{card.flipped || card.matched ? card.emoji : '❓'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.resetBtn} onPress={() => { setCards(makeCards()); setSelected([]); setMoves(0); }}>
        <Text style={styles.resetText}>🔄 Restart</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Number Sequence ────────────────────────────────────────
function NumberSequence({ onComplete, onBack }) {
  const [sequence] = useState(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1));
  const [input, setInput] = useState([]);
  const [phase, setPhase] = useState('show');

  const handleInput = (n) => {
    const next = [...input, n];
    setInput(next);
    if (next.length === sequence.length) {
      if (next.every((v, i) => v === sequence[i])) onComplete();
      else Alert.alert('❌ Wrong!', `Correct: ${sequence.join(' → ')}`, [{ text: 'Try Again', onPress: () => setInput([]) }]);
    }
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>🔢 Number Sequence</Text>
      {phase === 'show' ? (
        <>
          <Text style={styles.gameInfo}>Memorize this sequence:</Text>
          <View style={styles.seqRow}>{sequence.map((n, i) => <View key={i} style={styles.seqBadge}><Text style={styles.seqNum}>{n}</Text></View>)}</View>
          <TouchableOpacity style={styles.readyBtn} onPress={() => setPhase('input')}><Text style={styles.readyText}>I'm Ready! ✓</Text></TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.gameInfo}>Enter the sequence ({input.length}/{sequence.length}):</Text>
          <View style={styles.seqRow}>
            {Array.from({ length: sequence.length }).map((_, i) => (
              <View key={i} style={[styles.seqBadge, i < input.length && { backgroundColor: COLORS.success }]}>
                <Text style={styles.seqNum}>{input[i] || '?'}</Text>
              </View>
            ))}
          </View>
          <View style={styles.numPad}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <TouchableOpacity key={n} style={styles.numBtn} onPress={() => handleInput(n)}>
                <Text style={styles.numText}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.numBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => setInput(i => i.slice(0, -1))}>
              <Ionicons name="backspace-outline" size={26} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ── Word Recall ────────────────────────────────────────────
const WORD_SETS = [['Apple', 'Chair', 'River', 'Lamp', 'Cloud'], ['Dog', 'Book', 'Tree', 'Phone', 'Bread']];
function WordRecall({ onComplete, onBack }) {
  const [words] = useState(WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)]);
  const [phase, setPhase] = useState('show');
  const [selected, setSelected] = useState([]);
  const options = [...words, 'Table', 'Stone', 'Flower', 'Glass'].sort(() => Math.random() - 0.5);

  const toggle = (w) => setSelected(s => s.includes(w) ? s.filter(x => x !== w) : [...s, w]);
  const check = () => {
    const correct = words.every(w => selected.includes(w)) && selected.length === words.length;
    if (correct) onComplete();
    else Alert.alert('Try Again', `The words were: ${words.join(', ')}`, [{ text: 'OK', onPress: () => { setSelected([]); setPhase('show'); } }]);
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>📝 Word Recall</Text>
      {phase === 'show' ? (
        <>
          <Text style={styles.gameInfo}>Remember these {words.length} words:</Text>
          <View style={styles.wordGrid}>{words.map((w, i) => <View key={i} style={styles.wordBadge}><Text style={styles.wordText}>{w}</Text></View>)}</View>
          <TouchableOpacity style={styles.readyBtn} onPress={() => setPhase('recall')}><Text style={styles.readyText}>I Remember! ✓</Text></TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.gameInfo}>Select the words you saw:</Text>
          <View style={styles.wordGrid}>
            {options.map((w, i) => (
              <TouchableOpacity key={i} style={[styles.wordBadge, selected.includes(w) && styles.wordSelected]} onPress={() => toggle(w)}>
                <Text style={[styles.wordText, selected.includes(w) && { color: COLORS.white }]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.readyBtn} onPress={check}><Text style={styles.readyText}>Check Answers ✓</Text></TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── Breathing ─────────────────────────────────────────────
function Breathing({ onComplete, onBack }) {
  const [phase, setPhase] = useState('inhale');
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startCycle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 4000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 4000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 6000, useNativeDriver: true }),
    ]).start(() => { setCycles(c => c + 1); if (cycles >= 2) onComplete(); else startCycle(); });
  };

  return (
    <View style={[styles.gameContainer, { alignItems: 'center' }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>🌬️ Breathing Exercise</Text>
      <Animated.View style={[styles.breathCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={{ fontSize: 50 }}>🌬️</Text>
      </Animated.View>
      <Text style={styles.breathInstr}>Inhale 4s  →  Hold 4s  →  Exhale 6s</Text>
      <Text style={styles.breathCycles}>Cycles: {cycles}/3</Text>
      <TouchableOpacity style={styles.readyBtn} onPress={startCycle}><Text style={styles.readyText}>Start Breathing</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.readyBtn, { backgroundColor: COLORS.success, marginTop: SPACING.sm }]} onPress={onComplete}><Text style={styles.readyText}>Done ✓</Text></TouchableOpacity>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────
const ACTIVITIES = [
  { key: 'memory', label: 'Memory Match', emoji: '🃏', desc: 'Match pairs of cards to train memory', color: '#EAF2FF' },
  { key: 'sequence', label: 'Number Sequence', emoji: '🔢', desc: 'Remember and repeat number sequences', color: '#FFF3E0' },
  { key: 'words', label: 'Word Recall', emoji: '📝', desc: 'Memorize and recall a list of words', color: '#E8F5E9' },
  { key: 'breathing', label: 'Breathing Exercise', emoji: '🌬️', desc: 'Calm your mind with guided breathing', color: '#EDE7F6' },
];

export default function ActivitiesScreen() {
  const { user } = useAuth();
  const [active, setActive] = useState(null);

  const complete = async (label, score) => {
    try { await logActivity(user.uid, `Completed ${label}${score != null ? ` in ${score} moves` : ''}`); } catch (_) {}
    Alert.alert('🎉 Great Job!', `You completed ${label}! Keep it up!`, [{ text: 'Done', onPress: () => setActive(null) }]);
  };

  if (active === 'memory') return <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}><MemoryGame onComplete={(m) => complete('Memory Match', m)} onBack={() => setActive(null)} /></ScrollView>;
  if (active === 'sequence') return <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}><NumberSequence onComplete={() => complete('Number Sequence')} onBack={() => setActive(null)} /></ScrollView>;
  if (active === 'words') return <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}><WordRecall onComplete={() => complete('Word Recall')} onBack={() => setActive(null)} /></ScrollView>;
  if (active === 'breathing') return <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}><Breathing onComplete={() => complete('Breathing Exercise')} onBack={() => setActive(null)} /></ScrollView>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧩 Activities</Text>
        <Text style={styles.headerSub}>Keep your mind sharp every day</Text>
      </View>
      <Text style={styles.sectionLabel}>Choose an activity:</Text>
      {ACTIVITIES.map(a => (
        <TouchableOpacity key={a.key} style={styles.actCard} onPress={() => setActive(a.key)} activeOpacity={0.85}>
          <View style={[styles.actIconBox, { backgroundColor: a.color }]}>
            <Text style={{ fontSize: 36 }}>{a.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actTitle}>{a.label}</Text>
            <Text style={styles.actDesc}>{a.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.subtext} />
        </TouchableOpacity>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionLabel: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  actCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2 },
  actIconBox: { width: 64, height: 64, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  actTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  actDesc: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  gameContainer: { padding: SPACING.lg, paddingTop: SPACING.md },
  backBtn: { paddingBottom: SPACING.sm },
  backText: { fontSize: FONTS.medium, color: COLORS.primary, fontWeight: '600' },
  gameTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  gameInfo: { fontSize: FONTS.medium, color: COLORS.subtext, marginBottom: SPACING.md },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginBottom: SPACING.md },
  memCard: { width: 76, height: 76, borderRadius: RADIUS.md, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  memMatched: { backgroundColor: '#E8F5E9' },
  memEmoji: { fontSize: 34 },
  resetBtn: { alignSelf: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, elevation: 1 },
  resetText: { fontSize: FONTS.medium, color: COLORS.primary, fontWeight: '600' },
  seqRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, justifyContent: 'center' },
  seqBadge: { width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  seqNum: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  readyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, alignSelf: 'center' },
  readyText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  numPad: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginBottom: SPACING.lg },
  numBtn: { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  numText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginBottom: SPACING.lg },
  wordBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, elevation: 1 },
  wordSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  wordText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  breathCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#EDE7F6', justifyContent: 'center', alignItems: 'center', marginVertical: SPACING.xl, elevation: 4 },
  breathInstr: { fontSize: FONTS.medium, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  breathCycles: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.primary, marginBottom: SPACING.lg },
});
