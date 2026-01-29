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
    
    // 在开发环境中，重定向到本地静态文件
    // 在生产环境中，重定向到正确的静态文件URL
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // 开发环境：重定向到本地静态文件
      const localUrl = `/models/${encodeURIComponent(fileName)}`;
      return NextResponse.redirect(new URL(localUrl, request.url));
    } else {
      // 生产环境：重定向到正确的静态文件URL
      // 这里需要根据您的实际部署环境调整URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ll.yosoro.site';
      const staticUrl = `${baseUrl}/models/${encodeURIComponent(fileName)}`;
      return NextResponse.redirect(staticUrl);
    }
  } catch (error) {
    console.error('Error serving model file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
