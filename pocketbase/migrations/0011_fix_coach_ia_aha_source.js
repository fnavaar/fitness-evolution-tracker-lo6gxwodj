/// <reference path="../pb_data/types.d.ts" />
// Substitui incrementalmente a fonte AHA bloqueada por um PDF oficial acessível.
migrate(
  (app) => {
    $ai.agents.deleteMemories(app, 'fitness-coach', [
      'https://www.heart.org/en/about-us/heart-attack-and-stroke-symptoms',
    ])
    $ai.agents.putMemories(app, 'fitness-coach', [
      {
        type: 'url',
        payload: {
          url: 'https://www.heart.org/en/-/media/Files/Health-Topics/Heart-Attack/Do-It-Yourself-Health-Lesson-Heart-Attack-With-Notes.pdf?sc_lang=en',
        },
        payload_key:
          'https://www.heart.org/en/-/media/Files/Health-Topics/Heart-Attack/Do-It-Yourself-Health-Lesson-Heart-Attack-With-Notes.pdf?sc_lang=en',
      },
    ])
  },
  (app) => {
    $ai.agents.deleteMemories(app, 'fitness-coach', [
      'https://www.heart.org/en/-/media/Files/Health-Topics/Heart-Attack/Do-It-Yourself-Health-Lesson-Heart-Attack-With-Notes.pdf?sc_lang=en',
    ])
  },
)
