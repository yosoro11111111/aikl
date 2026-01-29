import { NextResponse, NextRequest } from 'next/server';

// 使用Edge Runtime，满足Cloudflare Pages要求
export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    // 解析动态路由参数
    const resolvedParams = await params;
    // 解码base64文件名
    const fileName = Buffer.from(resolvedParams.name, 'base64').toString('utf8');
    
    // 构建正确的静态文件URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const staticUrl = `${protocol}://${host}/models/${fileName}`;
    
    // 在Edge Runtime中，使用fetch API读取静态文件
    const response = await fetch(staticUrl);
    
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
