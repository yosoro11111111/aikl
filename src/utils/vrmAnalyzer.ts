import { VRM, VRMHumanBoneName, VRMExpressionPresetName } from '@pixiv/three-vrm';

// VRM文件动作分析器
interface VRMActionInfo {
  // 基础信息
  modelName: string;
  fileName: string;
  
  // 骨骼信息
  availableBones: string[];
  hasFacialExpressions: boolean;
  hasHandGestures: boolean;
  
  // 特殊动作检测
  specialActions: {
    id: string;
    name: string;
    description: string;
    bones: string[];
    isComplex: boolean;
  }[];
  
  // 表情系统
  expressions: {
    preset: VRMExpressionPresetName;
    available: boolean;
    intensity: number;
  }[];
}

// 预定义的常见特殊动作模式
const COMMON_ACTION_PATTERNS = [
  {
    id: 'dance',
    name: '舞蹈',
    description: '检测到舞蹈动作',
    bones: ['hips', 'spine', 'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg']
  },
  {
    id: 'wave',
    name: '挥手',
    description: '检测到挥手动作',
    bones: ['leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand']
  },
  {
    id: 'bow',
    name: '鞠躬',
    description: '检测到鞠躬动作',
    bones: ['spine', 'chest', 'head', 'hips']
  },
  {
    id: 'victory',
    name: '胜利姿势',
    description: '检测到胜利姿势',
    bones: ['leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand']
  },
  {
    id: 'magic',
    name: '魔法姿势',
    description: '检测到魔法施法姿势',
    bones: ['leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand']
  }
];

// 角色特定的动作映射
const CHARACTER_SPECIFIC_ACTIONS: Record<string, string[]> = {
  // 原神角色
  'Klee': ['jump', 'laugh', 'magic'],
  'Qiqi': ['bow', 'shy', 'heal'],
  'HuTao': ['dance', 'laugh', 'ghost'],
  'RaidenShogun': ['sword', 'serious', 'lightning'],
  'Keqing': ['sword', 'teleport', 'serious'],
  'Ganyu': ['bow', 'shy', 'ice'],
  'YaeMiko': ['magic', 'fox', 'seductive'],
  
  // 崩坏：星穹铁道角色
  'Bronya': ['gun', 'serious', 'command'],
  'Seele': ['scythe', 'dash', 'serious'],
  'Himeko': ['sword', 'elegant', 'coffee'],
  'Kafka': ['gun', 'seductive', 'mind_control'],
  'SilverWolf': ['hacking', 'cool', 'tech'],
  'March7th': ['bow', 'cheerful', 'photo']
};

export class VRMAnalyzer {
  
  /**
   * 分析VRM文件，提取特殊动作信息
   */
  static async analyzeVRM(vrm: VRM, fileName: string): Promise<VRMActionInfo> {
    const actionInfo: VRMActionInfo = {
      modelName: fileName.replace('.vrm', ''),
      fileName,
      availableBones: [],
      hasFacialExpressions: false,
      hasHandGestures: false,
      specialActions: [],
      expressions: []
    };

    // 分析骨骼系统
    if (vrm.humanoid) {
      const humanBones = Object.values(VRMHumanBoneName);
      actionInfo.availableBones = humanBones.filter(boneName => 
        vrm.humanoid.getNormalizedBoneNode(boneName as VRMHumanBoneName)
      );
    }

    // 分析表情系统
    if (vrm.expressionManager) {
      actionInfo.hasFacialExpressions = true;
      const expressionPresets = Object.values(VRMExpressionPresetName);
      
      actionInfo.expressions = expressionPresets.map(preset => ({
        preset,
        available: vrm.expressionManager!.getExpression(preset) !== null,
        intensity: 1.0
      }));
    }

    // 检测特殊动作模式
    actionInfo.specialActions = this.detectSpecialActions(actionInfo.modelName, actionInfo.availableBones);

    // 检测手势能力
    actionInfo.hasHandGestures = actionInfo.availableBones.some(bone => 
      bone.includes('Hand') || bone.includes('Finger')
    );

    return actionInfo;
  }

  /**
   * 检测特殊动作模式
   */
  private static detectSpecialActions(modelName: string, availableBones: string[]): VRMActionInfo['specialActions'] {
    const actions: VRMActionInfo['specialActions'] = [];

    // 检测常见动作模式
    COMMON_ACTION_PATTERNS.forEach(pattern => {
      const hasRequiredBones = pattern.bones.every(bone => 
        availableBones.some(availableBone => availableBone.toLowerCase().includes(bone.toLowerCase()))
      );

      if (hasRequiredBones) {
        actions.push({
          id: pattern.id,
          name: pattern.name,
          description: pattern.description,
          bones: pattern.bones,
          isComplex: pattern.bones.length > 3
        });
      }
    });

    // 添加角色特定动作
    const characterActions = CHARACTER_SPECIFIC_ACTIONS[modelName] || [];
    characterActions.forEach(actionId => {
      if (!actions.some(a => a.id === actionId)) {
        actions.push({
          id: actionId,
          name: this.getActionName(actionId),
          description: `角色 ${modelName} 的特殊动作`,
          bones: this.getActionBones(actionId),
          isComplex: true
        });
      }
    });

    return actions;
  }

  /**
   * 获取动作名称
   */
  private static getActionName(actionId: string): string {
    const actionNames: Record<string, string> = {
      'jump': '跳跃',
      'laugh': '大笑',
      'magic': '魔法',
      'heal': '治疗',
      'ghost': '幽灵',
      'sword': '剑术',
      'lightning': '雷电',
      'teleport': '瞬移',
      'ice': '冰霜',
      'fox': '狐狸',
      'seductive': '魅惑',
      'gun': '枪械',
      'command': '指挥',
      'scythe': '镰刀',
      'dash': '冲刺',
      'elegant': '优雅',
      'coffee': '咖啡',
      'mind_control': '精神控制',
      'hacking': '黑客',
      'cool': '酷炫',
      'tech': '科技',
      'cheerful': '开朗',
      'photo': '拍照'
    };

    return actionNames[actionId] || actionId;
  }

  /**
   * 获取动作相关的骨骼
   */
  private static getActionBones(actionId: string): string[] {
    const actionBones: Record<string, string[]> = {
      'jump': ['hips', 'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg'],
      'laugh': ['head', 'chest', 'spine'],
      'magic': ['leftHand', 'rightHand', 'leftLowerArm', 'rightLowerArm'],
      'heal': ['leftHand', 'rightHand', 'chest'],
      'ghost': ['hips', 'spine', 'head'],
      'sword': ['rightHand', 'rightLowerArm', 'rightUpperArm', 'spine'],
      'lightning': ['leftHand', 'rightHand', 'head'],
      'teleport': ['hips', 'spine', 'head'],
      'ice': ['leftHand', 'rightHand'],
      'fox': ['head', 'spine', 'hips'],
      'seductive': ['head', 'chest', 'hips'],
      'gun': ['rightHand', 'rightLowerArm', 'rightUpperArm'],
      'command': ['rightHand', 'head', 'chest'],
      'scythe': ['leftHand', 'rightHand', 'spine'],
      'dash': ['hips', 'leftUpperLeg', 'rightUpperLeg'],
      'elegant': ['head', 'chest', 'spine'],
      'coffee': ['leftHand', 'rightHand', 'head'],
      'mind_control': ['head', 'leftHand', 'rightHand'],
      'hacking': ['leftHand', 'rightHand', 'head'],
      'cool': ['head', 'chest', 'hips'],
      'tech': ['leftHand', 'rightHand', 'head'],
      'cheerful': ['head', 'chest', 'hips'],
      'photo': ['leftHand', 'rightHand', 'head']
    };

    return actionBones[actionId] || ['hips', 'spine', 'head'];
  }

  /**
   * 生成动作适配配置
   */
  static generateActionConfig(actionInfo: VRMActionInfo) {
    const config = {
      modelName: actionInfo.modelName,
      fileName: actionInfo.fileName,
      
      // 基础动作配置
      idleAnimations: ['idle_look_around', 'idle_stretch'],
      
      // 特殊动作配置
      specialActions: actionInfo.specialActions.map(action => ({
        id: action.id,
        name: action.name,
        animation: action.id,
        priority: action.isComplex ? 8 : 5,
        duration: action.isComplex ? 3000 : 2000,
        conditions: {
          emotion: ['happy', 'excited', 'neutral'],
          minAffection: 0
        }
      })),
      
      // 表情配置
      expressions: actionInfo.expressions
        .filter(expr => expr.available)
        .map(expr => ({
          preset: expr.preset,
          intensity: expr.intensity,
          blendShape: expr.preset.toLowerCase()
        }))
    };

    return config;
  }
}