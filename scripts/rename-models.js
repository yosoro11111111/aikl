const fs = require('fs');
const path = require('path');

const modelsDir = path.join(process.cwd(), 'public', 'models');

// 中文到英文文件名映射表
const nameMapping = {
  // 原神角色
  '七七': 'Qiqi',
  '七七2': 'Qiqi2',
  '万叶': 'Kazuha',
  '丽莎': 'Lisa',
  '久岐忍': 'KukiShinobu',
  '九条裟罗': 'KujouSara',
  '五郎 (1)': 'Gorou',
  '优菈 (1)': 'Eula',
  '优菈 (2)': 'Eula2',
  '八重神子': 'YaeMiko',
  '公子': 'Tartaglia',
  '凝光': 'Ningguang',
  '凝光2': 'Ningguang2',
  '凯亚 (2)': 'Kaeya',
  '刻晴 (2)': 'Keqing',
  '北斗': 'Beidou',
  '卡维': 'Kaveh',
  '可莉': 'Klee',
  '坎蒂丝': 'Candace',
  '多莉': 'Dori',
  '女士': 'Signora',
  '妮露': 'Nilou',
  '安柏': 'Amber',
  '安柏2': 'Amber2',
  '托马': 'Thoma',
  '散兵': 'Scaramouche',
  '散兵2': 'Scaramouche2',
  '早柚': 'Sayu',
  '枫原万叶': 'KaedeharaKazuha',
  '柯莱': 'Collei',
  '派蒙': 'Paimon',
  '流浪者': 'Wanderer',
  '温迪': 'Venti',
  '烟绯': 'Yanfei',
  '珊瑚宫心海': 'SangonomiyaKokomi',
  '珐露珊': 'Faruzan',
  '班尼特': 'Bennett',
  '琴 (1)': 'Jean',
  '琴 (2)': 'Jean2',
  '瑶瑶': 'Yaoyao',
  '甘雨 (2)': 'Ganyu',
  '申鹤 (2)': 'Shenhe',
  '申鹤': 'Shenhe2',
  '白术': 'Baizhu',
  '砂糖': 'Sucrose',
  '神里绫华': 'KamisatoAyaka',
  '空': 'Aether',
  '米卡': 'Mika',
  '纳西妲': 'Nahida',
  '罗莎莉亚 (2)': 'Rosaria',
  '罗莎莉亚': 'Rosaria2',
  '胡桃': 'HuTao',
  '艾尔海森': 'Alhaitham',
  '莫娜': 'Mona',
  '莫娜2': 'Mona2',
  '莱依拉': 'Layla',
  '菲谢尔 (2)': 'Fischl',
  '蔡诺': 'Tsaritsa',
  '行秋': 'Xingqiu',
  '诺艾尔': 'Noelle',
  '辛焱': 'Xinyan',
  '迪卢克 (2)': 'Diluc',
  '重云': 'Chongyun',
  '钟离': 'Zhongli',
  '长野原宵宫': 'Yoimiya',
  '阿蕾奇诺': 'Arlecchino',
  '雷泽': 'Razor',
  '雷电将军': 'RaidenShogun',
  '雷电将军2': 'RaidenShogun2',
  '香菱': 'Xiangling',
  '魈': 'Xiao',
  '鹿野院平藏 (2)': 'ShikanoinHeizou',
  '鹿野院平藏': 'ShikanoinHeizou2'
};

console.log('开始重命名模型文件...');

try {
  const files = fs.readdirSync(modelsDir);
  const vrmFiles = files.filter(file => file.endsWith('.vrm'));
  
  let renamedCount = 0;
  
  for (const file of vrmFiles) {
    const fileName = file.replace('.vrm', '');
    
    // 如果文件名在映射表中，进行重命名
    if (nameMapping[fileName]) {
      const newFileName = nameMapping[fileName] + '.vrm';
      const oldPath = path.join(modelsDir, file);
      const newPath = path.join(modelsDir, newFileName);
      
      // 检查新文件名是否已存在
      if (!fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`重命名: ${file} -> ${newFileName}`);
        renamedCount++;
      } else {
        console.log(`跳过: ${newFileName} 已存在`);
      }
    }
  }
  
  console.log(`\n重命名完成! 共重命名了 ${renamedCount} 个文件`);
  
} catch (error) {
  console.error('重命名过程中出错:', error);
  process.exit(1);
}