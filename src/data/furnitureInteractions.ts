
import { Action } from '@/store/useStore';

export interface Interaction {
  label: string;
  action: Action | string; // maps to animation name
  targetOffset: [number, number, number]; // Offset from furniture center for avatar position
  lookAtOffset: [number, number, number]; // Where avatar should face (relative to furniture)
}

export const FURNITURE_INTERACTIONS: Record<string, Interaction[]> = {
  bed: [
    { label: '睡觉 (Sleep)', action: 'sleep', targetOffset: [0, 0.46, 0], lookAtOffset: [0, 0.46, 2] },
    { label: '坐下 (Sit)', action: 'sit_bed', targetOffset: [0.5, 0, 0], lookAtOffset: [0, 0.5, 1] },
    { label: '起床 (Wake Up)', action: 'idle', targetOffset: [1.2, 0, 0], lookAtOffset: [0, 0.5, 1] }
  ],
  sofa: [
    { label: '坐下 (Sit)', action: 'sit_sofa', targetOffset: [0, 0, 0.3], lookAtOffset: [0, 0.5, 1] },
    { label: '躺下 (Lie)', action: 'lie_sofa', targetOffset: [0, 0.5, 0], lookAtOffset: [1, 0.5, 0] },
    { label: '站起 (Stand Up)', action: 'idle', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 1] }
  ],
  chair: [
    { label: '坐下 (Sit)', action: 'sit_chair', targetOffset: [0, 0, 0.1], lookAtOffset: [0, 0.5, 1] },
    { label: '站起 (Stand Up)', action: 'idle', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 1] }
  ],
  table: [
    { label: '观察 (Observe)', action: 'idle_look_around', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 0] },
    { label: '擦桌子 (Clean)', action: 'reach_out', targetOffset: [0, 0, 0.8], lookAtOffset: [0, 0.5, 0] }
  ],
  piano: [
    { label: '弹奏 (Play)', action: 'play_piano', targetOffset: [0, 0, 0.5], lookAtOffset: [0, 0.5, -1] },
    { label: '停止 (Stop)', action: 'idle', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 1] }
  ],
  computer: [
    { label: '使用 (Use)', action: 'type_keyboard', targetOffset: [0, 0, 0.5], lookAtOffset: [0, 0.5, -1] },
    { label: '离开 (Leave)', action: 'idle', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 1] }
  ],
  cat_bed: [
    { label: '查看 (Check)', action: 'crouch', targetOffset: [0, 0, 0.8], lookAtOffset: [0, 0, 0] }
  ],
  lamp: [
    { label: '开关 (Toggle)', action: 'reach_out', targetOffset: [0.5, 0, 0], lookAtOffset: [0, 1, 0] }
  ],
  coffee_machine: [
    { label: '泡咖啡 (Brew)', action: 'brew_coffee', targetOffset: [0, 0, 0.6], lookAtOffset: [0, 0.5, 0] },
    { label: '喝咖啡 (Drink)', action: 'idle', targetOffset: [0, 0, 0.6], lookAtOffset: [0, 0.5, 0] }
  ],
  tree: [
    { label: '欣赏 (Admire)', action: 'idle_look_around', targetOffset: [0, 0, 1.5], lookAtOffset: [0, 1, 0] },
    { label: '浇水 (Water)', action: 'reach_out', targetOffset: [0.5, 0, 1], lookAtOffset: [0, 0.5, 0] }
  ],
  bookshelf: [
    { label: '浏览 (Browse)', action: 'idle_look_around', targetOffset: [0, 0, 1], lookAtOffset: [0, 1, 0] },
    { label: '拿书 (Take Book)', action: 'reach_out', targetOffset: [0.3, 0, 0.8], lookAtOffset: [0, 1.5, 0] }
  ],
  rug: [
    { label: '站立 (Stand)', action: 'idle_look_around', targetOffset: [0, 0, 0], lookAtOffset: [0, 0, 1] },
    { label: '躺下 (Lie)', action: 'sleep', targetOffset: [0, 0, 0], lookAtOffset: [0, 0, 2] }
  ],
  tv: [
    { label: '看电视 (Watch)', action: 'idle_look_around', targetOffset: [0, 0, 2], lookAtOffset: [0, 0.5, 0] },
    { label: '关闭 (Turn Off)', action: 'reach_out', targetOffset: [0.5, 0, 0.5], lookAtOffset: [0, 0.5, 0] }
  ],
  plant: [
    { label: '浇水 (Water)', action: 'reach_out', targetOffset: [0.4, 0, 0.4], lookAtOffset: [0, 0.5, 0] },
    { label: '修剪 (Trim)', action: 'reach_out', targetOffset: [0.3, 0, 0.3], lookAtOffset: [0, 0.5, 0] }
  ],
  clock: [
    { label: '看时间 (Check Time)', action: 'idle_look_around', targetOffset: [0, 0, 1], lookAtOffset: [0, 1, 0] }
  ],
  painting: [
    { label: '鉴赏 (Appreciate)', action: 'idle_look_around', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 0] }
  ],
  desk: [
    { label: '工作 (Work)', action: 'type_keyboard', targetOffset: [0, 0, 0.6], lookAtOffset: [0, 0.5, -0.5] },
    { label: '整理 (Organize)', action: 'reach_out', targetOffset: [0, 0, 0.6], lookAtOffset: [0, 0.5, 0] }
  ],
  stool: [
    { label: '坐下 (Sit)', action: 'sit_chair', targetOffset: [0, 0, 0], lookAtOffset: [0, 0.5, 1] },
    { label: '站起 (Stand Up)', action: 'idle', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 1] }
  ],
  cabinet: [
    { label: '打开 (Open)', action: 'reach_out', targetOffset: [0, 0, 0.8], lookAtOffset: [0, 0.5, 0] }
  ],
  mirror: [
    { label: '照镜子 (Look)', action: 'idle_look_around', targetOffset: [0, 0, 0.8], lookAtOffset: [0, 1, 0] }
  ],
  fireplace: [
    { label: '取暖 (Warm)', action: 'crouch', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 0] }
  ],
  bean_bag: [
    { label: '休息 (Rest)', action: 'sit_sofa', targetOffset: [0, 0.2, 0], lookAtOffset: [0, 0.5, 1] },
    { label: '站起 (Stand Up)', action: 'idle', targetOffset: [0, 0, 1], lookAtOffset: [0, 0.5, 1] }
  ]
};
