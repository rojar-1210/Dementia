import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { logActivity } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

// ── Memory Match ───────────────────────────────────────────
const EMOJIS = ['🍎', '🐶', '🌸', '⭐', '🎵', '🏠'];
function MemoryMatch({ onDone }) {
  const [cards, setCards] = useState(() =>
    [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
  );
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);

  const flip = (card) => {
    if (card.flipped || card.matched || selected.length === 2) return;
    const updated = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c);
    const sel = [...selected, card];
    setCards(updated); setSelected(sel);
    if (sel.length === 2) {
      setMoves(m => m + 1);
      if (sel[0].emoji === sel[1].emoji) {
        const matched = updated.map(c => c.emoji === sel[0].emoji ? { ...c, matched: true } : c);
        setCards(matched); setSelected([]);
        if (matched.every(c => c.matched)) onDone(moves + 1);
      } else {
        setTimeout(() => {
          setCards(p => p.map(c => sel.find(s => s.id === c.id) && !c.matched ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  };

  return (
    <View>
      <Text style={styles.gameInfo}>Moves: {moves}</Text>
      <View style={styles.cardGrid}>
        {cards.map(c => (
          <TouchableOpacity key={c.id} style={[styles.memCard, c.matched && styles.memMatched]} onPress={() => flip(c)}>
            <Text style={styles.memEmoji}>{c.flipped || c.matched ? c.emoji : '❓'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Number Sequence ────────────────────────────────────────
function NumberSequence({ onDone }) {
  const [seq] = useState(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 9) + 1));
  const [input, setInput] = useState([]);
  const [phase, setPhase] = useState('show');

  const press = (n) => {
    const next = [...input, n];
    setInput(next);
    if (next.length === seq.length) {
      if (next.every((v, i) => v === seq[i])) onDone();
      else Alert.alert('Wrong!', `Correct: ${seq.join(' → ')}`, [{ text: 'Try Again', onPress: () => setInput([]) }]);
    }
  };

  return (
    <View style={styles.seqWrap}>
      {phase === 'show' ? (
        <>
          <Text style={styles.seqTitle}>Remember this sequence:</Text>
          <View style={styles.seqRow}>{seq.map((n, i) => <View key={i} style={styles.seqBadge}><Text style={styles.seqNum}>{n}</Text></View>)}</View>
          <TouchableOpacity style={styles.seqBtn} onPress={() => setPhase('input')}><Text style={styles.seqBtnText}>I'm Ready!</Text></TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.seqTitle}>Enter the sequence:</Text>
          <View style={styles.seqRow}>{input.map((n, i) => <View key={i} style={[styles.seqBadge, { backgroundColor: COLORS.success }]}><Text style={styles.seqNum}>{n}</Text></View>)}</View>
          <View style={styles.numPad}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <TouchableOpacity key={n} style={styles.numBtn} onPress={() => press(n)}>
                <Text style={styles.numText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── Daily Quiz ─────────────────────────────────────────────
const QUIZ = [
  { q: 'What season comes after Summer?', opts: ['Winter', 'Autumn', 'Spring', 'Monsoon'], ans: 1 },
  { q: 'How many days are in a week?', opts: ['5', '6', '7', '8'], ans: 2 },
  { q: 'What color is the sky on a clear day?', opts: ['Green', 'Blue', 'Red', 'Yellow'], ans: 1 },
];
function DailyQuiz({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const pick = (i) => {
    const correct = i === QUIZ[idx].ans;
    if (correct) setScore(s => s + 1);
    if (idx + 1 < QUIZ.length) setIdx(idx + 1);
    else onDone(score + (correct ? 1 : 0));
  };
  return (
    <View style={styles.quizWrap}>
      <Text style={styles.quizQ}>{QUIZ[idx].q}</Text>
      <Text style={styles.quizProgress}>{idx + 1} / {QUIZ.length}</Text>
      {QUIZ[idx].opts.map((o, i) => (
        <TouchableOpacity key={i} style={styles.quizOpt} onPress={() => pick(i)}>
          <Text style={styles.quizOptText}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────
const GAMES = [
  { key: 'memory', label: 'Memory Match', emoji: '🃏', desc: 'Match pairs of cards' },
  { key: 'sequence', label: 'Number Sequence', emoji: '🔢', desc: 'Remember and repeat numbers' },
  { key: 'quiz', label: 'Daily Quiz', emoji: '🧠', desc: 'Answer simple questions' },
  { key: 'breathing', label: 'Breathing Exercise', emoji: '🌬️', desc: 'Calm your mind' },
];

export default function GamesScreen() {
  const { user } = useAuth();
  const [active, setActive] = useState(null);

  const done = async (label, score) => {
    await logActivity(user.uid, `Completed ${label}${score !== undefined ? ` — Score: ${score}` : ''}`);
    Alert.alert('🎉 Great Job!', `You completed ${label}!`, [{ text: 'Done', onPress: () => setActive(null) }]);
  };

  if (active === 'memory') return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => setActive(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>🃏 Memory Match</Text>
      <MemoryMatch onDone={(m) => done('Memory Match', m)} />
    </ScrollView>
  );

  if (active === 'sequence') return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => setActive(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>🔢 Number Sequence</Text>
      <NumberSequence onDone={() => done('Number Sequence')} />
    </ScrollView>
  );

  if (active === 'quiz') return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => setActive(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.gameTitle}>🧠 Daily Quiz</Text>
      <DailyQuiz onDone={(s) => done('Daily Quiz', `${s}/${QUIZ.length}`)} />
    </ScrollView>
  );

  if (active === 'breathing') return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <TouchableOpacity style={styles.back} onPress={() => setActive(null)}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={{ fontSize: 80 }}>🌬️</Text>
      <Text style={styles.gameTitle}>Breathing Exercise</Text>
      <Text style={styles.breathText}>Inhale... 4 seconds{'\n'}Hold... 4 seconds{'\n'}Exhale... 6 seconds</Text>
      <TouchableOpacity style={styles.doneBtn} onPress={() => done('Breathing Exercise')}>
        <Text style={styles.doneBtnText}>Done ✓</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧩 Memory Games</Text>
      </View>
      <Text style={styles.subtitle}>Keep your mind sharp with daily activities</Text>
      {GAMES.map(g => (
        <TouchableOpacity key={g.key} style={styles.gameCard} onPress={() => setActive(g.key)}>
          <Text style={styles.gameEmoji}>{g.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.gameName}>{g.label}</Text>
            <Text style={styles.gameDesc}>{g.desc}</Text>
          </View>
          <Text style={{ fontSize: 22, color: COLORS.subtext }}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.sm },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONTS.medium, color: COLORS.subtext, padding: SPACING.lg, paddingBottom: SPACING.sm },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2 },
  gameEmoji: { fontSize: 40, marginRight: SPACING.md },
  gameName: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  gameDesc: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  back: { padding: SPACING.lg, paddingBottom: 0 },
  backText: { fontSize: FONTS.medium, color: COLORS.primary, fontWeight: '600' },
  gameTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, padding: SPACING.lg, paddingBottom: SPACING.sm },
  gameInfo: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.md, gap: SPACING.sm, justifyContent: 'center' },
  memCard: { width: 80, height: 80, borderRadius: RADIUS.md, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  memMatched: { backgroundColor: '#E8F5E9' },
  memEmoji: { fontSize: 36 },
  seqWrap: { padding: SPACING.lg, alignItems: 'center' },
  seqTitle: { fontSize: FONTS.large, color: COLORS.text, marginBottom: SPACING.md, textAlign: 'center' },
  seqRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  seqBadge: { width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  seqNum: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  seqBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  seqBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  numPad: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center', marginTop: SPACING.md },
  numBtn: { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  numText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  quizWrap: { padding: SPACING.lg },
  quizQ: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  quizProgress: { fontSize: FONTS.small, color: COLORS.subtext, marginBottom: SPACING.lg },
  quizOpt: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 1 },
  quizOptText: { fontSize: FONTS.medium, color: COLORS.text },
  breathText: { fontSize: FONTS.large, color: COLORS.text, textAlign: 'center', lineHeight: 44, marginVertical: SPACING.lg },
  doneBtn: { backgroundColor: COLORS.success, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  doneBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});
