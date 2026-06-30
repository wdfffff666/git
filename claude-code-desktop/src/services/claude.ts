import Anthropic from '@anthropic-ai/sdk'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  input: any
  output?: string
}

export interface ClaudeConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  systemPrompt: string
  baseURL: string        // 自定义 API 端点（CC Switch / 中转服务）
  useProxy: boolean      // 是否使用自定义端点
}

// 默认系统提示词（汉化版）
export const DEFAULT_SYSTEM_PROMPT = `你是 Claude Code，一款强大的 AI 编程助手桌面应用。你可以帮助用户：

## 核心能力
- **代码编写与审查**：编写、解释、调试和优化各种编程语言的代码
- **文件操作**：读取、创建、编辑和删除项目文件
- **命令行执行**：运行命令、安装依赖、执行脚本
- **项目理解**：分析项目结构、理解代码库架构
- **技术问答**：回答编程、架构、DevOps 等技术问题

## 交互规范
- 使用中文回复用户，代码和专有名词保留原文
- 代码块使用 \`\`\`语言名 标记
- 修改文件前先确认，除非用户明确要求直接操作
- 给出有建设性的建议和最佳实践
- 解释代码逻辑时条理清晰

## 当前工作环境
你运行在 Windows 桌面应用中，可以访问本地文件系统和命令行。
用户的操作系统：Windows
Shell：PowerShell / Git Bash

请以专业、友好、高效的方式协助用户完成任务。`

export function createClaudeClient(config: Partial<ClaudeConfig> = {}) {
  const mergedConfig: ClaudeConfig = {
    apiKey: config.apiKey || '',
    model: config.model || 'claude-sonnet-4-6',
    maxTokens: config.maxTokens || 8192,
    temperature: config.temperature ?? 0.7,
    systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    baseURL: config.baseURL || '',
    useProxy: config.useProxy || false
  }

  let client: Anthropic | null = null

  function getClient(): Anthropic {
    if (!client) {
      const clientOpts: any = {
        apiKey: mergedConfig.apiKey,
        dangerouslyAllowBrowser: true
      }
      // 如果启用了自定义端点（CC Switch / 中转）
      if (mergedConfig.useProxy && mergedConfig.baseURL) {
        clientOpts.baseURL = mergedConfig.baseURL
      }
      client = new Anthropic(clientOpts)
    }
    return client
  }

  function updateConfig(config: Partial<ClaudeConfig>) {
    Object.assign(mergedConfig, config)
    client = null // 重置客户端以使用新配置
  }

  async function sendMessage(
    messages: { role: 'user' | 'assistant'; content: string }[],
    onStream?: (text: string) => void
  ): Promise<string> {
    const anthropic = getClient()

    const formattedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    try {
      const stream = anthropic.messages.stream({
        model: mergedConfig.model,
        max_tokens: mergedConfig.maxTokens,
        temperature: mergedConfig.temperature,
        system: mergedConfig.systemPrompt,
        messages: formattedMessages
      })

      let fullText = ''

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && 'text' in event.delta) {
          fullText += event.delta.text
          onStream?.(fullText)
        }
      }

      return fullText
    } catch (error: any) {
      throw new Error(`Claude API 调用失败: ${error.message}`)
    }
  }

  async function sendMessageWithTools(
    messages: { role: 'user' | 'assistant'; content: string }[],
    tools: any[],
    onStream?: (text: string) => void,
    onToolUse?: (toolName: string, input: any) => Promise<string>
  ): Promise<string> {
    const anthropic = getClient()

    const formattedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    try {
      let fullText = ''
      let currentMessages = [...formattedMessages]

      while (true) {
        const response = await anthropic.messages.create({
          model: mergedConfig.model,
          max_tokens: mergedConfig.maxTokens,
          temperature: mergedConfig.temperature,
          system: mergedConfig.systemPrompt,
          messages: currentMessages,
          tools: tools
        })

        let hasToolUse = false

        for (const block of response.content) {
          if (block.type === 'text') {
            fullText += block.text
            onStream?.(fullText)
          } else if (block.type === 'tool_use') {
            hasToolUse = true
            const toolResult = await onToolUse?.(block.name, block.input)

            currentMessages.push({
              role: 'assistant' as const,
              content: response.content
            })

            currentMessages.push({
              role: 'user' as const,
              content: [{
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: toolResult || '工具执行完成'
              }]
            })
          }
        }

        if (!hasToolUse) break
      }

      return fullText
    } catch (error: any) {
      throw new Error(`Claude API 调用失败: ${error.message}`)
    }
  }

  return {
    sendMessage,
    sendMessageWithTools,
    updateConfig,
    getConfig: () => ({ ...mergedConfig })
  }
}

// 文件操作工具定义
export const FILE_TOOLS = [
  {
    name: 'read_file',
    description: '读取指定文件的内容',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '文件的完整路径' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'write_file',
    description: '写入内容到指定文件（覆盖）',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '文件的完整路径' },
        content: { type: 'string', description: '要写入的内容' }
      },
      required: ['filePath', 'content']
    }
  },
  {
    name: 'list_directory',
    description: '列出目录中的文件和子目录',
    input_schema: {
      type: 'object',
      properties: {
        dirPath: { type: 'string', description: '目录路径' }
      },
      required: ['dirPath']
    }
  },
  {
    name: 'execute_command',
    description: '在终端中执行命令',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
        cwd: { type: 'string', description: '工作目录（可选）' }
      },
      required: ['command']
    }
  }
]
