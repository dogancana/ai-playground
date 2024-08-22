import { logger } from '@/logger';
import { format } from 'date-fns';
import { pick } from 'lodash';
import OpenAI from 'openai';
import { AgentConfig, ConversationMessage } from './models';
import { Tool } from './tools/models';

export const DEFAULT_CONFIG: Omit<AgentConfig, 'OPENAI_API_KEY'> = {
  model: 'gpt-4o-mini',
  limit: 50,
  addDateToSystemPrompt: true,
};

export class Agent {
  private openai: OpenAI;
  private config: AgentConfig;

  constructor(
    private systemPrompt: string,
    OPENAI_API_KEY: string,
    config: Partial<Omit<AgentConfig, 'OPEN_AI_API_KEY'>> = {},
    private conversation: ConversationMessage[] = [],
    private tools: Tool[] = []
  ) {
    this.config = { OPENAI_API_KEY, ...DEFAULT_CONFIG, ...config };
    this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }

  /**
   * Calls completion endpoint of OpenAI to generate a response.
   * If there were tool calls in the response, executes them and re-runs the completion.
   * In case of tool calls, the last response will be returned
   * @returns The last conversation message generated by the agent.
   */
  public async completion(): Promise<ConversationMessage> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: await this.prepareConversation(),
        temperature: 0.5,
        max_tokens: 1000,
        stream: false,
        tools: this.tools.map((f) => ({
          type: 'function',
          function: pick(f, ['name', 'parameters', 'description']),
        })),
      });

      const choice = response.choices[0];
      if (!choice) throw new Error('No response from OpenAI');

      const messageParam = choice?.message;
      if (!messageParam) throw new Error('No message in completion response');

      const conversationMessage = { timestamp: new Date(), messageParam };
      this.conversation.push(conversationMessage);

      if (choice.message.tool_calls)
        return this.executeToolCalls(choice.message.tool_calls);

      return conversationMessage;
    } catch (e) {
      logger.error('Completion error', e);
      const message: ConversationMessage = {
        timestamp: new Date(),
        messageParam: {
          role: 'system',
          content: "There was a problem. I couldn't respond.",
        },
      };
      this.conversation.push(message);
      return message;
    }
  }

  /**
   * Executes the tool calls received from completion response.
   * Adds the results to the conversation.
   */
  private async executeToolCalls(
    calls: OpenAI.ChatCompletionMessageToolCall[]
  ) {
    const methods = calls
      .map((c) => ({ ...c.function, id: c.id }))
      .map((call) => {
        const resp = (content: string): ConversationMessage => ({
          timestamp: new Date(),
          messageParam: {
            role: 'tool',
            tool_call_id: call.id,
            content,
          },
        });

        return async (): Promise<ConversationMessage> => {
          try {
            const tool = this.tools.find((f) => f.name === call.name);
            if (!tool) return resp('Tool not found.');

            const params = JSON.parse(call.arguments);
            const result = await tool.function(params);
            return resp(result);
          } catch (e) {
            logger.error('Tool execution error', {
              name: call.name,
              arguments: call.arguments,
              error: e,
            });
            return resp('There was a problem executing the tool.');
          }
        };
      });

    const results = await Promise.all(methods.map((m) => m()));
    this.conversation.push(...results);

    return this.completion();
  }

  public getConversation() {
    return this.conversation.map((m) => ({ ...m }));
  }

  private async prepareConversation() {
    const limit = Math.min(this.config?.limit ?? 50, 200);
    return [
      await this.getSystemPrompt(),
      ...this.conversation.slice(-limit).map((message) => message.messageParam),
    ];
  }

  private async getSystemPrompt(): Promise<OpenAI.ChatCompletionSystemMessageParam> {
    const toolContext = (
      await Promise.all(this.tools.map((f) => f.context()))
    ).join('\n');

    const dateContext = this.config.addDateToSystemPrompt
      ? `
    # Context
    Today's date is ${format(new Date(), 'yyyy-MM-dd')}
    The time is ${format(new Date(), 'HH:mm')}`
      : '';

    return {
      role: 'system',
      content: `${this.systemPrompt}
      
      ${dateContext}
      ${toolContext}
      `,
    };
  }
}
