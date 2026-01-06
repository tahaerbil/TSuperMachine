/**
 * SimpleProvider - A lightweight, embedded AI that works without external services
 * Perfect for testing and basic commands
 */

import type { AIProvider, ChatMessage, ToolDefinition, AIResponse } from '../types';
import { toolRegistry } from '../ToolRegistry';

interface CommandPattern {
    patterns: RegExp[];
    handler: (match: RegExpMatchArray, input: string) => Promise<string> | string;
}

export class SimpleProvider implements AIProvider {
    id = 'simple';
    type: 'local' | 'cloud' = 'local'; // Treat as local for UI purposes

    private commands: CommandPattern[] = [
        // Calculator commands
        {
            patterns: [
                /hesapla[:\s]+(.+)/i,
                /calculate[:\s]+(.+)/i,
                /(\d+[\s]*[+\-*/^%][\s]*[\d\s+\-*/^%().]+)/,
                /what is (\d+[\s]*[+\-*/^%][\s]*[\d\s+\-*/^%().]+)/i,
                /sin\(|cos\(|tan\(|sqrt\(|log\(/i,
            ],
            handler: async (match, input) => {
                const expression = match[1] || input;
                const tool = toolRegistry.getTool('calculate');
                if (tool) {
                    const result = await tool.execute({ expression }) as { success: boolean; result?: string; error?: string };
                    if (result.success) {
                        return `📊 **Sonuç:** ${result.result}`;
                    }
                    return `❌ Hesaplama hatası: ${result.error}`;
                }
                return 'Hesap makinesi bulunamadı.';
            }
        },
        // List files commands
        {
            patterns: [
                /dosyalar[ıi]?\s*(listele|göster|neler var)/i,
                /list\s*(files|folder|directory)/i,
                /klasör[üu]?\s*(içeriği|göster)/i,
                /show\s*(files|documents)/i,
                /what('s| is) in (the )?(workspace|folder)/i,
            ],
            handler: async () => {
                const tool = toolRegistry.getTool('list_files');
                if (tool) {
                    const result = await tool.execute({ path: '/' }) as {
                        success: boolean;
                        summary?: string;
                        folders?: string[];
                        files?: { name: string; size: string }[];
                        error?: string;
                    };
                    if (result.success) {
                        let response = `📁 **Workspace İçeriği:**\n\n`;
                        if (result.folders?.length) {
                            response += `**Klasörler:**\n${result.folders.map(f => `  📂 ${f}`).join('\n')}\n\n`;
                        }
                        if (result.files?.length) {
                            response += `**Dosyalar:**\n${result.files.map(f => `  📄 ${f.name} (${f.size})`).join('\n')}`;
                        }
                        return response;
                    }
                    return `❌ Dosyalar listelenemiyor: ${result.error}`;
                }
                return 'Dosya listesi aracı bulunamadı.';
            }
        },
        // Help / capabilities
        {
            patterns: [
                /ne yapabilirsin/i,
                /yeteneklerin/i,
                /what can you do/i,
                /help/i,
                /yardım/i,
                /capabilities/i,
            ],
            handler: () => {
                return `🤖 **T-Brain Mini Yetenekleri:**

**Hesaplama:**
- "hesapla: 2+2*3"
- "sin(45)" veya "sqrt(144)"

**Dosya Yönetimi:**
- "dosyaları listele"
- "klasör içeriğini göster"

**Widget Oluşturma:**
- "not widget'ı oluştur"
- "hesap makinesi ekle"
- "yeni proje widget'ı"

**Hakkında:**
- "saat kaç"
- "bugün ne gün"

_💡 Tam AI deneyimi için Settings → AI sekmesinden Ollama ayarlayın._`;
            }
        },
        // Time/Date
        {
            patterns: [
                /saat kaç/i,
                /what time/i,
                /current time/i,
            ],
            handler: () => {
                const now = new Date();
                return `🕐 Şu an saat: **${now.toLocaleTimeString('tr-TR')}**`;
            }
        },
        {
            patterns: [
                /bugün ne gün/i,
                /tarih/i,
                /what day/i,
                /today('s)? date/i,
            ],
            handler: () => {
                const now = new Date();
                return `📅 Bugün: **${now.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}**`;
            }
        },
        // Widget creation commands
        {
            patterns: [
                /not\s*(widget'?[iı]?|kutusu)?\s*(oluştur|ekle|aç)/i,
                /create\s*note/i,
                /add\s*note\s*widget/i,
                /yeni\s*not/i,
            ],
            handler: () => {
                return `📝 **Not Widget'ı Oluşturma:**

Toolbar'dan "Not" simgesine tıklayarak yeni bir not widget'ı ekleyebilirsiniz.

_Otomatik widget oluşturma yakında eklenecek._`;
            }
        },
        {
            patterns: [
                /hesap\s*makine(si)?\s*(oluştur|ekle|aç)/i,
                /calculator\s*(widget)?\s*(create|add)/i,
            ],
            handler: () => {
                return `🔢 **Hesap Makinesi Widget'ı:**

Toolbar'dan "Hesap Makinesi" simgesine tıklayarak ekleyebilirsiniz.

Veya doğrudan hesaplama yapabilirim:
- "hesapla: 15 * 7"
- "sqrt(256)"`;
            }
        },
        // Greeting
        {
            patterns: [
                /^(merhaba|selam|hey|hi|hello)/i,
            ],
            handler: () => {
                const greetings = [
                    'Merhaba! 👋 Size nasıl yardımcı olabilirim?',
                    'Selam! 🤖 Bugün ne yapmak istersiniz?',
                    'Hey! ✨ T-Brain Mini hazır ve nazır!',
                ];
                return greetings[Math.floor(Math.random() * greetings.length)];
            }
        },
        // Thanks
        {
            patterns: [
                /teşekkür|sağol|thanks|thank you/i,
            ],
            handler: () => {
                return 'Rica ederim! 😊 Başka bir şey lazım olursa buradayım.';
            }
        },
    ];

    async generateResponse(
        messages: ChatMessage[],
        _tools?: ToolDefinition[],
        onStream?: (chunk: string) => void
    ): Promise<AIResponse> {
        // Get the last user message
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const userMessage = lastUserMessage?.content || '';

        const response = await this.processMessage(userMessage);

        // Simulate streaming for better UX
        if (onStream) {
            const words = response.split(' ');
            for (let i = 0; i < words.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 30));
                onStream(words[i] + (i < words.length - 1 ? ' ' : ''));
            }
        }

        return {
            content: response
        };
    }

    private async processMessage(input: string): Promise<string> {
        const trimmed = input.trim();

        // Check each command pattern
        for (const command of this.commands) {
            for (const pattern of command.patterns) {
                const match = trimmed.match(pattern);
                if (match) {
                    const result = await command.handler(match, trimmed);
                    return result;
                }
            }
        }

        // Default response
        return `🤔 Anlamadım. Şunları deneyebilirsiniz:

- **Hesaplama:** "hesapla: 5+3"
- **Dosyalar:** "dosyaları listele"
- **Yardım:** "ne yapabilirsin"

_Tam AI için Settings → AI sekmesinden Ollama ayarlayın._`;
    }
}

export const simpleProvider = new SimpleProvider();
