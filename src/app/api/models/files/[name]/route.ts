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
    
    // 始终重定向到相对路径的静态文件
    // Next.js会自动处理静态文件服务，无论是在开发环境还是生产环境
    const staticUrl = `/models/${encodeURIComponent(fileName)}`;
    return NextResponse.redirect(new URL(staticUrl, request.url));
  } catch (error) {
    console.error('Error serving model file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
