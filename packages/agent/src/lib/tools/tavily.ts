import { logger } from 'logger';
import { OpenAI } from 'openai';
import { Tool } from './models';

const BASE_URL = 'https://api.tavily.com/';

interface SearchResult {
  query: string;
  answer: string;
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
  }[];
}

export class TavilyWebSearchTool implements Tool {
  name = 'TavilyWebSearch';
  description = `A tool for searching the web to answer various questions or to fetch up to date information.`;
  parameters: OpenAI.FunctionParameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to use when searching the web.',
      },
    },
  };

  constructor(private TAVILY_API_KEY: string) {}

  async function(parameters: Record<string, unknown>) {
    const keys = Object.keys(parameters);
    const query = keys[0];

    if (keys.length !== 1 || !query) {
      return 'Please provide a search query.';
    }

    const value = parameters[query];
    return this.search(value as string);
  }

  async context() {
    return '';
  }

  private async search(query: string) {
    try {
      const response = await saerch(query, this.TAVILY_API_KEY);
      if (!response) return 'No results found.';

      const { answer, results } = response;
      const str = results
        .map((r) => `Title: ${r.title}, URL: ${r.url}, Content: ${r.content}`)
        .join('\n');

      return `Search results for "${query}":
          Answer: ${answer}
          Results: ${str}
      `;
    } catch (e) {
      logger.error('Web search error', { e });
      return 'There was a problem searching the web.';
    }
  }
}

async function saerch(query: string, TAVILY_API_KEY: string) {
  const result = await fetch(`${BASE_URL}search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, api_key: TAVILY_API_KEY }),
  });

  if (!result.ok) {
    throw new Error('Failed to fetch search results');
  }

  const data = (await result.json()) as SearchResult;
  return data;
}
