import { useRef } from 'react';
import { useStore, Message } from '@/store/useStore';
import { useSoundManager } from '@/hooks/useSoundManager';

export const useGiftSystem = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMessage, setIsThinking, apiKey, activeModels, personality, messages } = useStore();
  const { playSound } = useSoundManager();

  const handleGiftClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    event.target.value = '';

    playSound('click');

    const isImage = file.type.startsWith('image/');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        sendGiftMessage(file.name, 'image', result);
      };
      reader.readAsDataURL(file);
    } else if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Limit text length to avoid token limits
        const truncated = result.slice(0, 3000) + (result.length > 3000 ? '\n...(truncated)' : '');
        sendGiftMessage(file.name, 'text', truncated);
      };
      reader.readAsText(file);
    } else {
        // Fallback for other files - just send name
        sendGiftMessage(file.name, 'file', 'Binary or unsupported file type');
    }
  };

  const sendGiftMessage = async (fileName: string, type: 'image' | 'text' | 'file', content: string) => {
    const userMsg: Message = {
      role: 'user',
      content: `I have a gift for you: ${fileName}`,
      id: Date.now().toString(),
      attachment: {
        type,
        name: fileName,
        url: type === 'image' ? content : undefined,
        content: type === 'text' ? content : undefined
      }
    };

    addMessage(userMsg);
    setIsThinking(true);

    // AI Processing
    const currentModel = activeModels.length > 0 ? activeModels[0] : null;
    const persona = currentModel ? (currentModel.description || `You are ${currentModel.name}.`) : "You are a helpful AI assistant.";
    
    let prompt = "";
    if (type === 'image') {
        prompt = `User sent you an image named "${fileName}". Since you cannot see it directly yet, pretend you are looking at it. 
        It is a gift for you. React with surprise and happiness. 
        Ask the user what this picture is about or compliment it vaguely (e.g., "Wow, the colors are amazing!").
        Give a suggestion related to images (e.g., "We should frame this!" or "Is this from your trip?").`;
    } else if (type === 'text') {
        prompt = `User sent you a text file named "${fileName}".
        Content snippet:
        """
        ${content}
        """
        
        Read the content above. 
        1. Summarize what you think this is.
        2. Give a specific suggestion or feedback based on the content.
        3. React enthusiastically as if receiving a gift.
        `;
    } else {
        prompt = `User sent you a file named "${fileName}". Thank them for the gift and ask what it is inside.`;
    }

    const SYSTEM_INSTRUCTION = `
    Instructions:
    - ${persona}
    - You just received a GIFT from the user.
    - React appropriately (Happy, Excited, Curious).
    - ${prompt}
    - Keep replies concise (2-3 sentences).
    - Use [emotion:xxx] and [action:xxx] tags.
    `;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                ...messages.slice(-5), 
                userMsg
            ],
            apiKey 
        }),
      });
      
      const data = await res.json();
      
      // We don't need to process response here as ChatInterface listens to messages and will handle the reply
      // But we need to add the assistant message manually if the API returns text
      // Wait... ChatInterface handles handleSend -> fetch -> processResponse
      // Here we are duplicating logic. Ideally we should expose processResponse from ChatInterface or useStore?
      // No, useStore doesn't handle API.
      
      // Let's manually add the response message
      if (data.reply) {
          addMessage({
              role: 'assistant',
              content: data.reply,
              id: (Date.now() + 1).toString()
          });
      }
      
    } catch (error) {
      console.error(error);
      addMessage({
          role: 'assistant',
          content: "[emotion:sad] [action:cry] 呜呜，礼物好像在传输过程中丢了... (Network Error)",
          id: (Date.now() + 1).toString()
      });
    } finally {
        setIsThinking(false);
    }
  };

  return {
    fileInputRef,
    handleGiftClick,
    processFile
  };
};
