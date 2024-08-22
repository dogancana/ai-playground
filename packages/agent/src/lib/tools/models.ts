import { OpenAI } from 'openai';

/**
 * Core interface of a tool to be added to the agent.
 */
export interface Tool extends OpenAI.FunctionDefinition {
  /**
   * Function to execute when LLM calls the tool
   * @param parameters
   */
  function(parameters: Record<string, unknown>): Promise<string>;

  /**
   * Context to provide to LLM on any completion request to LLM.
   * Some tools may need to provide stateful context to LLM.
   * Context aims to provide that stateful information.
   * If no context is needed, return an empty string.
   *
   * @example Voice channel management tool may provide the current voice channel members.
   * @example Music player tool may provide the current song playing and songs in the queue.
   */
  context(): Promise<string>;
}
