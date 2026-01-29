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

  const models = files
    .filter(file => file.endsWith('.vrm'))
    .map(file => {
      const name = file.replace('.vrm', '');
      // 使用URL安全的base64编码文件名，避免URL路径分隔符问题
      const base64Name = Buffer.from(file).toString('base64url');
      // 移除可能的等号
      const urlSafeBase64Name = base64Name.replace(/=/g, '');
      return {
        id: name,
        name: name,
        url: `/api/models/files/${urlSafeBase64Name}`,
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
