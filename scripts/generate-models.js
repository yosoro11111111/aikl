const fs = require('fs');
const path = require('path');

const modelsDir = path.join(process.cwd(), 'public', 'models');
const outputFile = path.join(process.cwd(), 'src', 'data', 'models.json');

console.log('Generating models.json...');

try {
  // Ensure directory exists
  if (!fs.existsSync(modelsDir)) {
    console.log('No models directory found at:', modelsDir);
    // Create empty array if no directory
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  const files = fs.readdirSync(modelsDir);

  // 中文到英文文件名映射表（与重命名脚本保持一致）
  const nameMapping = {
    'Qiqi': '七七',
    'Qiqi2': '七七2',
    'Kazuha': '万叶',
    'Lisa': '丽莎',
    'KukiShinobu': '久岐忍',
    'KujouSara': '九条裟罗',
    'Gorou': '五郎',
    'Eula': '优菈',
    'Eula2': '优菈2',
    'YaeMiko': '八重神子',
    'Tartaglia': '公子',
    'Ningguang': '凝光',
    'Ningguang2': '凝光2',
    'Kaeya': '凯亚',
    'Keqing': '刻晴',
    'Beidou': '北斗',
    'Kaveh': '卡维',
    'Klee': '可莉',
    'Candace': '坎蒂丝',
    'Dori': '多莉',
    'Signora': '女士',
    'Nilou': '妮露',
    'Amber': '安柏',
    'Amber2': '安柏2',
    'Thoma': '托马',
    'Scaramouche': '散兵',
    'Scaramouche2': '散兵2',
    'Sayu': '早柚',
    'KaedeharaKazuha': '枫原万叶',
    'Collei': '柯莱',
    'Paimon': '派蒙',
    'Wanderer': '流浪者',
    'Venti': '温迪',
    'Yanfei': '烟绯',
    'SangonomiyaKokomi': '珊瑚宫心海',
    'Faruzan': '珐露珊',
    'Bennett': '班尼特',
    'Jean': '琴',
    'Jean2': '琴2',
    'Yaoyao': '瑶瑶',
    'Ganyu': '甘雨',
    'Shenhe': '申鹤',
    'Shenhe2': '申鹤2',
    'Baizhu': '白术',
    'Sucrose': '砂糖',
    'KamisatoAyaka': '神里绫华',
    'Aether': '空',
    'Mika': '米卡',
    'Nahida': '纳西妲',
    'Rosaria': '罗莎莉亚',
    'Rosaria2': '罗莎莉亚2',
    'HuTao': '胡桃',
    'Alhaitham': '艾尔海森',
    'Mona': '莫娜',
    'Mona2': '莫娜2',
    'Layla': '莱依拉',
    'Fischl': '菲谢尔',
    'Tsaritsa': '蔡诺',
    'Xingqiu': '行秋',
    'Noelle': '诺艾尔',
    'Xinyan': '辛焱',
    'Diluc': '迪卢克',
    'Chongyun': '重云',
    'Yoimiya': '长野原宵宫',
    'Arlecchino': '阿蕾奇诺',
    'Razor': '雷泽',
    'RaidenShogun': '雷电将军',
    'RaidenShogun2': '雷电将军2',
    'Xiangling': '香菱',
    'Xiao': '魈',
    'ShikanoinHeizou': '鹿野院平藏',
    'ShikanoinHeizou2': '鹿野院平藏2'
  };

  const models = files
    .filter(file => file.endsWith('.vrm'))
    .map(file => {
      const englishName = file.replace('.vrm', '');
      const chineseName = nameMapping[englishName] || englishName;
       
       // 使用相对路径，网页运行时动态构建完整URL
         return {
           id: englishName,
           name: chineseName,
           url: `/models/${encodeURIComponent(file)}`,
           description: '本地模型',
           defaultEmotion: 'neutral'
         };
    });

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(models, null, 2));
  console.log(`Successfully generated models.json with ${models.length} models.`);
} catch (error) {
  console.error('Error generating models.json:', error);
  process.exit(1);
}
