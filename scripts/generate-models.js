const fs = require('fs');
const path = require('path');

const modelsDir = path.join(process.cwd(), 'public', 'models');
const outputFile = path.join(process.cwd(), 'src', 'data', 'models.json');

console.log('Generating models.json...');

// 从环境变量或配置中获取域名
const getDomain = () => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // 如果没有环境变量，使用默认域名
  return 'https://ll.yosoro.site';
};

const baseDomain = getDomain();

try {
  // Ensure directory exists
  if (!fs.existsSync(modelsDir)) {
    console.log('No models directory found at:', modelsDir);
    // Create empty array if no directory
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  const files = fs.readdirSync(modelsDir);

  const models = files
    .filter(file => file.endsWith('.vrm'))
    .map(file => {
      const name = file.replace('.vrm', '');
      
      // 使用完整的静态文件URL，避免API路由问题
       return {
         id: name,
         name: name,
         url: `${baseDomain}/models/${encodeURIComponent(file)}`,
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
