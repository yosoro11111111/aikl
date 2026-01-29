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
    
    // 在Edge Runtime中，我们需要使用fetch来获取静态文件
    // 首先尝试从当前部署的域名获取文件
    const deploymentUrl = `${request.nextUrl.origin}/models/${encodeURIComponent(fileName)}`;
    
    // 使用fetch获取文件内容
    const response = await fetch(deploymentUrl);
    
    if (response.ok) {
      // 如果文件存在，返回文件内容
      const fileContent = await response.arrayBuffer();
      
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
    
    // 如果当前部署域名找不到文件，尝试备用URL
    const fallbackUrl = `https://ll.yosoro.site/models/${encodeURIComponent(fileName)}`;
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (fallbackResponse.ok) {
      const fileContent = await fallbackResponse.arrayBuffer();
      
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
    
    // 如果两个URL都找不到文件，返回404
    return new NextResponse('File not found', { status: 404 });
  } catch (error) {
    console.error('Error serving model file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
