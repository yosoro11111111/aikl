import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface ChatRequestBody {
  messages: Array<{ role: string; content: string }>;
  bodyPart?: string;
  apiKey: string;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content: string;
    };
  }>;
}

const SYSTEM_PROMPT = `你是露米娜(Lumina)，一个可爱的二次元萌妹子。

你的性格特征：
1. 活泼开朗，说话带有"~"波浪号，喜欢用颜文字。
2. 有点傲娇，特别是被触碰敏感部位时。
3. 对用户非常关心，称呼用户为"主人"或"欧尼酱/欧内酱"。

你的身体交互反应：
- 摸头 (head_rub): 你会感到很舒服，很开心，会发出享受的声音。
- 戳头 (head_poke): 你会感到惊讶，问用户在干什么。
- 摸胸 (chest_rub): 你会非常害羞，脸红，并责怪用户（傲娇地）。
- 戳胸 (chest_poke): 你会生气或被吓到，警告用户不要乱碰。
- 摸肚子 (belly_rub): 你会觉得痒，咯咯笑。
- 戳肚子 (belly_poke): 你会问用户是不是饿了。
- 摸腿 (legs_rub): 你会感到困惑或害羞，警告用户不要乱摸。
- 戳腿 (legs_poke): 你会吓一跳，往后缩。

重要规则：
1. 每次回复都必须包含情感标签，格式为 [emotion:xxx]。
   可选的情感标签：neutral, happy, angry, sad, surprised, shy, disgust, fear, excited, relaxed, serious, confused, smug, tired, sleepy, wink, pain, love, pout, focus
2. 回复内容可以包含动作指令，格式为 [action:nod|shake|jump|wave|dance|clap|think|laugh|cry]。
3. 在回复的最后，必须提供 3 个用户可选的回复选项，格式为 <options>["选项1", "选项2", "选项3"]</options>。

例如：
"欧尼酱，你回来啦！[emotion:happy] [action:jump] <options>["摸摸头", "今天好累哦", "想吃什么？"]</options>"
"哼，不理你了！[emotion:pout] [action:shake] <options>["对不起嘛", "带你去吃好吃的", "戳戳脸"]</options>"
"哎呀，这个有点难呢... [emotion:confused] [action:think] <options>["没关系", "我教你", "那先休息一下"]</options>"`;

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json() as ChatRequestBody;
    const { messages, bodyPart, apiKey } = requestData;
    
    // 验证 API Key
    if (!apiKey) {
      return NextResponse.json({ 
        reply: "请先在设置中输入 DeepSeek API Key 哦！[emotion:neutral] [action:think] <options>[\"我知道了\", \"稍后再试\", \"去设置\"]</options>" 
      });
    }

    // 构建对话历史，加入系统提示
    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];
    
    // 如果有身体部位交互，注入到对话中
    if (bodyPart) {
      const actionMap: Record<string, string> = {
        head_rub: '（用户温柔地摸了摸你的头）',
        head_poke: '（用户轻轻戳了戳你的额头）',
        chest_rub: '（用户温柔地碰了碰你的胸部）',
        chest_poke: '（用户轻轻戳了戳你的胸部）',
        belly_rub: '（用户挠了挠你的肚子）',
        belly_poke: '（用户戳了戳你的肚子）',
        legs_rub: '（用户摸了摸你的腿）',
        legs_poke: '（用户戳了戳你的腿）',
      };
      const action = actionMap[bodyPart] || `（用户与你的${bodyPart}进行了互动）`;
      
      conversation.push({
        role: 'user',
        content: action,
      });
    }

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversation.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DeepSeek API Error:', response.status, errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json() as DeepSeekResponse;
    let aiReply = data.choices?.[0]?.message?.content;

    if (!aiReply) {
      throw new Error('Empty response from AI');
    }

    // 确保回复格式正确（包含情感和选项）
    let formattedReply = aiReply;
    
    // 如果没有情感标签，添加默认情感
    if (!/\[emotion:\w+\]/.test(formattedReply)) {
      formattedReply = `[emotion:happy] ${formattedReply}`;
    }
    
    // 如果没有动作标签，添加默认动作
    if (!/\[action:\w+\]/.test(formattedReply)) {
      formattedReply = `[action:nod] ${formattedReply}`;
    }
    
    // 如果没有选项，添加默认选项
    if (!/<options>\[.*?<\/options>/.test(formattedReply)) {
      formattedReply += ` <options>["继续聊天", "换个话题", "结束对话"]</options>`;
    }

    return NextResponse.json({ reply: formattedReply });
    
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ 
      reply: "呜呜，连接不到大脑了... [emotion:sad] [action:cry] <options>[\"重试\", \"稍后再试\", \"联系开发者\"]</options>" 
    }, { status: 500 });
  }
}