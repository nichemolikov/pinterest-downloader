import os
import asyncio
from typing import Optional
from mcp.server.fastmcp import FastMCP
from openai import OpenAI

# Initialize FastMCP server
mcp = FastMCP("OpenAI-Compatible-Server")

# Configuration
DEFAULT_BASE_URL = "http://127.0.0.1:8045/v1"
DEFAULT_API_KEY = "sk-3ccf14935ddb4cb9a61defea897f86ed"
DEFAULT_MODEL = "claude-sonnet-4-5"

@mcp.tool()
async def ask_local_ai(prompt: str, model: Optional[str] = None) -> str:
    """
    Ask a question to the local OpenAI-compatible AI server.
    
    Args:
        prompt: The question or instruction for the AI.
        model: Optional model name to use. Defaults to claude-sonnet-4-5.
    """
    client = OpenAI(
        base_url=os.getenv("OPENAI_BASE_URL", DEFAULT_BASE_URL),
        api_key=os.getenv("OPENAI_API_KEY", DEFAULT_API_KEY)
    )
    
    try:
        response = client.chat.completions.create(
            model=model or DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error connecting to local AI server: {str(e)}"

if __name__ == "__main__":
    mcp.run()
