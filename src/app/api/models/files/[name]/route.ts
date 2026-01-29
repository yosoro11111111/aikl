import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    // 等待params解析
    const resolvedParams = await params;
    
    // 解码base64编码的文件名
    const fileName = Buffer.from(resolvedParams.name, 'base64').toString('utf8');
    
    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', 'models', fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // 读取文件内容
    const fileContent = fs.readFileSync(filePath);
    
    // 返回文件内容
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving model file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
