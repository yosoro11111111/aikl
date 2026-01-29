import { NextResponse, NextRequest } from 'next/server';

// 使用Edge Runtime，满足Cloudflare Pages要求
export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    // 解析动态路由参数
    const resolvedParams = await params;
    // 解码Base64文件名，处理标准Base64和URL安全Base64编码
    let fileName;
    try {
      // 先尝试URL安全的Base64解码
      fileName = Buffer.from(resolvedParams.name, 'base64url').toString('utf8');
    } catch (e) {
      // 如果失败，尝试标准Base64解码
      try {
        fileName = Buffer.from(resolvedParams.name, 'base64').toString('utf8');
      } catch (e) {
        // 如果都失败，返回400错误
        return new NextResponse('Invalid Base64 encoding', { status: 400 });
      }
    }
    
    // 在生产环境中，模型文件应该位于根目录下的/models路径
    // 使用当前请求的域名，而不是硬编码的域名
    const staticUrl = `${request.nextUrl.origin}/models/${encodeURIComponent(fileName)}`;
    
    console.log('Fetching model file from:', staticUrl);
    
    // 使用fetch获取文件内容
    const response = await fetch(staticUrl);
    
    if (response.ok) {
      // 如果文件存在，返回文件内容
      const fileContent = await response.arrayBuffer();
      
      console.log('Model file found:', fileName);
      
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    console.log('Model file not found:', fileName, 'Status:', response.status);
    
    // 如果文件不存在，返回404
    return new NextResponse('File not found', { status: 404 });
  } catch (error) {
    console.error('Error serving model file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
