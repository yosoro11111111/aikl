import { NextResponse } from 'next/server';

// 使用Edge Runtime，满足Cloudflare Pages要求
export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: { name: string } }) {
  try {
    // 解码base64文件名
    const fileName = Buffer.from(params.name, 'base64').toString('utf8');
    
    // 构建静态文件路径
    const filePath = `https://${request.headers.get('host') || 'localhost:3000'}/models/${encodeURIComponent(fileName)}`;
    
    // 使用fetch API获取文件
    const response = await fetch(filePath);
    
    if (!response.ok) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // 获取文件内容
    const fileContent = await response.arrayBuffer();
    
    // 返回文件内容
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`
      }
    });
  } catch (error) {
    console.error('Error serving model file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
