import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const VIDEOS = [
  { category: 'Morning Exercise', emoji: '🌅', items: [
    { title: 'Gentle Morning Stretches', url: 'https://www.youtube.com/watch?v=4pKly2JojMw', duration: '10 min' },
    { title: 'Chair Exercises for Seniors', url: 'https://www.youtube.com/watch?v=Nq9oJT5IQHY', duration: '15 min' },
  ]},
  { category: 'Brain Training', emoji: '🧠', items: [
    { title: 'Memory Improvement Exercises', url: 'https://www.youtube.com/watch?v=TjPFZaMe2yw', duration: '8 min' },
    { title: 'Cognitive Brain Exercises', url: 'https://www.youtube.com/watch?v=9G5mS_OKT0A', duration: '12 min' },
  ]},
  { category: 'Relaxation', emoji: '😌', items: [
    { title: 'Guided Meditation for Seniors', url: 'https://www.youtube.com/watch?v=inpok4MKVLM', duration: '10 min' },
    { title: 'Calming Breathing Exercises', url: 'https://www.youtube.com/watch?v=tybOi4hjZFQ', duration: '7 min' },
  ]},
  { category: 'Yoga', emoji: '🧘', items: [
    { title: 'Chair Yoga for Seniors', url: 'https://www.youtube.com/watch?v=qJNNLhEkMgc', duration: '20 min' },
    { title: 'Gentle Yoga for Memory', url: 'https://www.youtube.com/watch?v=v7AYKMP6rOE', duration: '15 min' },
  ]},
];

export default function ExercisesScreen() {
  const [expanded, setExpanded] = useState('Morning Exercise');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎥 Exercise Videos</Text>
      </View>
      <Text style={styles.subtitle}>Stay active and healthy with guided videos</Text>

      {VIDEOS.map(cat => (
        <View key={cat.category} style={styles.section}>
          <TouchableOpacity style={styles.catHeader} onPress={() => setExpanded(expanded === cat.category ? null : cat.category)}>
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={styles.catTitle}>{cat.category}</Text>
            <Ionicons name={expanded === cat.category ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.subtext} />
          </TouchableOpacity>

          {expanded === cat.category && cat.items.map(v => (
            <TouchableOpacity key={v.title} style={styles.videoCard} onPress={() => Linking.openURL(v.url)}>
              <View style={styles.playBtn}>
                <Ionicons name="play-circle" size={44} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.videoTitle}>{v.title}</Text>
                <Text style={styles.videoDuration}>⏱ {v.duration} • YouTube</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={COLORS.subtext} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.sm },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONTS.medium, color: COLORS.subtext, padding: SPACING.lg, paddingBottom: SPACING.sm },
  section: { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  catHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2 },
  catEmoji: { fontSize: 28, marginRight: SPACING.sm },
  catTitle: { flex: 1, fontSize: FONTS.large, fontWeight: '700', color: COLORS.text },
  videoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF', borderRadius: RADIUS.sm, padding: SPACING.md, marginTop: 4, borderWidth: 1, borderColor: COLORS.border },
  playBtn: { marginRight: SPACING.sm },
  videoTitle: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  videoDuration: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
});
