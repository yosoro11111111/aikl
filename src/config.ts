// src/config.ts

export const INTERACTION_CONFIG = {
  AFFECTION_VALUES: {
    // Friendly
    hand_poke: 2,
    head_poke: 1,
    shoulder_poke: 1,
    arm_poke: 1,
    
    // Sensitive
    eye_poke: -2,
    neck_poke: -2,
    foot_poke: -2,
    face_poke: -1, // nose, mouth, ear
    belly_poke: -1,
    back_poke: -1,
    leg_poke: -1,

    // Very sensitive
    hips_poke: -3,
    chest_poke: -3,

    // Rubbing
    head_rub: 0.05,
    back_rub: 0.04,
    arm_rub: 0.03,
    belly_rub: 0.01,
    leg_rub: 0.02,
    hand_rub: 0.05,
    shoulder_rub: 0.03,
    neck_rub: -0.05, // 敏感部位
    chest_rub: -0.1, // 敏感部位
    hips_rub: -0.1, // 敏感部位
    foot_rub: -0.05,
  },
  HIT_FEEDBACK: {
    duration: 0.3,
    scale: 0.1,
  },
  RUB_AREAS: [
    { name: 'head', target: 'head_rub', affection: 0.3 },
    { name: 'back', target: 'back_rub', affection: 0.2 },
    { name: 'arm', target: 'arm_rub', affection: 0.1 },
    { name: 'hand', target: 'hand_rub', affection: 0.2 },
    { name: 'shoulder', target: 'shoulder_rub', affection: 0.1 },
    { name: 'belly', target: 'belly_rub', affection: 0.05 },
    { name: 'abdomen', target: 'belly_rub', affection: 0.05 },
    { name: 'leg', target: 'leg_rub', affection: 0.1 },
    { name: 'neck', target: 'neck_rub', affection: -0.1 },
    { name: 'chest', target: 'chest_rub', affection: -0.2 },
    { name: 'hips', target: 'hips_rub', affection: -0.2 },
    { name: 'foot', target: 'foot_rub', affection: -0.1 },
  ],
  RUB_HEAD: {
    minTime: 2, // Minimum time in seconds to trigger a positive reaction
    affectionBonus: 5,
  },
  BODY_PARTS: [
    // Friendly
    { name: 'hand', target: 'hand_poke' },
    { name: 'head', target: 'head_poke' },
    { name: 'shoulder', target: 'shoulder_poke' },
    { name: 'arm', target: 'arm_poke' },

    // Sensitive
    { name: 'eye', target: 'eye_poke' },
    { name: 'neck', target: 'neck_poke' },
    { name: 'foot', target: 'foot_poke' },
    { name: 'nose', target: 'face_poke' },
    { name: 'mouth', target: 'face_poke' },
    { name: 'ear', target: 'face_poke' },
    { name: 'belly', target: 'belly_poke' },
    { name: 'abdomen', target: 'belly_poke' },
    { name: 'back', target: 'back_poke' },
    { name: 'leg', target: 'leg_poke' },

    // Very sensitive
    { name: 'hips', target: 'hips_poke' },
    { name: 'butt', target: 'hips_poke' },
    { name: 'chest', target: 'chest_poke' },
    { name: 'bust', target: 'chest_poke' },
  ],
};
