import json
from pathlib import Path
from typing import Any, Dict, List

import markdown
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
# Mount content folder for component files and images
app.mount("/content", StaticFiles(directory="content"), name="content")

# Directory containing compiled markdown files
CONTENT_DIR = "content"
SCHEMA_FILE = "../content/content-schema.json"


def load_schema() -> List[Dict[str, Any]]:
    """Load the content schema JSON file"""
    schema_path = Path(SCHEMA_FILE)
    if not schema_path.exists():
        return []

    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading schema: {e}")
        return []


def get_navigation_items() -> List[Dict[str, str]]:
    """
    Get navigation items from schema
    Returns list of dicts with 'name' and 'slug' keys
    """
    schema = load_schema()
    nav_items = []

    for component in schema:
        name = component.get("name", "")
        # Create slug from name
        slug = name.lower().replace(" ", "-").replace("/", "-")
        nav_items.append({"name": name, "slug": slug})

    return nav_items


def extract_frontmatter(content: str) -> tuple[Dict[str, str], str]:
    """
    Extract frontmatter from markdown content
    Returns (frontmatter_dict, remaining_content)
    """
    frontmatter = {}

    if content.startswith("---"):
        # Find the closing ---
        end_marker = content.find("---", 3)
        if end_marker != -1:
            frontmatter_text = content[3:end_marker]
            remaining = content[end_marker + 3 :].strip()

            # Parse frontmatter
            for line in frontmatter_text.strip().split("\n"):
                if ":" in line:
                    key, value = line.split(":", 1)
                    frontmatter[key.strip()] = value.strip()

            return frontmatter, remaining

    return {}, content


def render_frontmatter_html(frontmatter: Dict[str, str]) -> str:
    """Render frontmatter as HTML"""
    if not frontmatter:
        return ""

    html = '<div class="frontmatter">\n'

    # Title is already in the h1, so skip it
    if "documentation-status" in frontmatter:
        html += f"  <p><strong>Documentation Status:</strong> {frontmatter['documentation-status']}</p>\n"

    if "type" in frontmatter:
        html += f"  <p><strong>Type:</strong> {frontmatter['type']}</p>\n"

    if "last-edited" in frontmatter:
        html += f"  <p><strong>Last Edited:</strong> {frontmatter['last-edited']}</p>\n"

    if "figma-link" in frontmatter and frontmatter['figma-link']:
        html += f'  <p><strong>Figma:</strong> <a href="{frontmatter["figma-link"]}" target="_blank" rel="noopener noreferrer">View in Figma</a></p>\n'

    if "code-link" in frontmatter and frontmatter['code-link']:
        html += f'  <p><strong>Code:</strong> <a href="{frontmatter["code-link"]}" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>\n'

    html += "</div>\n"

    return html


def get_markdown_content(slug: str) -> tuple[str, Dict[str, str]]:
    """
    Read and convert markdown file to HTML
    Returns (html_content, frontmatter)
    """
    file_path = Path(CONTENT_DIR) / slug / "index.md"

    if not file_path.exists():
        raise FileNotFoundError(f"Component not found: {slug}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract frontmatter
        frontmatter, markdown_content = extract_frontmatter(content)

        # Convert markdown to HTML
        md = markdown.Markdown(extensions=["extra", "codehilite"])
        html_content = md.convert(markdown_content)

        return html_content, frontmatter
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading file: {str(e)}"
        )


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Redirect to first component or show index"""
    nav_items = get_navigation_items()

    if nav_items:
        # Redirect to first component
        return RedirectResponse(
            url=f"/{nav_items[0]['slug']}", status_code=302
        )

    return templates.TemplateResponse(
        "content.html",
        {
            "request": request,
            "nav_items": nav_items,
            "current_slug": "",
            "content": "<h1>Component Wiki</h1><p>No components found.</p>",
            "page_title": "Component Wiki",
            "frontmatter": {},
        },
    )


@app.get("/{slug}", response_class=HTMLResponse)
async def serve_component(request: Request, slug: str):
    """Serve a component page"""
    try:
        # Get the content
        html_content, frontmatter = get_markdown_content(slug)

        # Get navigation items
        nav_items = get_navigation_items()

        # Render frontmatter
        frontmatter_html = render_frontmatter_html(frontmatter)

        # Combine frontmatter and content
        full_content = frontmatter_html + html_content

        # Get page title from frontmatter or slug
        page_title = frontmatter.get("title", slug.replace("-", " ").title())

        return templates.TemplateResponse(
            "content.html",
            {
                "request": request,
                "nav_items": nav_items,
                "current_slug": slug,
                "content": full_content,
                "page_title": page_title,
                "frontmatter": frontmatter,
            },
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Component not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
