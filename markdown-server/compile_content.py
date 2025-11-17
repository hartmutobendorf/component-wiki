"""
Script to compile component markdown files from content-schema.json
Combines usage, description, anatomy, and examples into single markdown files with frontmatter
Also copies images to the markdown-server content folder
"""

import json
import shutil
from pathlib import Path


def read_markdown_file(filepath: str) -> str:
    """Read a markdown file and return its content"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""
    except Exception as e:
        print(f"Warning: Error reading {filepath}: {e}")
        return ""


def copy_images(source_folder: Path, dest_folder: Path) -> int:
    """
    Copy images from source folder to destination folder
    Returns the number of images copied
    """
    images_copied = 0
    source_images = source_folder / "images"

    if not source_images.exists():
        return 0

    # Create destination images folder
    dest_images = dest_folder / "images"
    dest_images.mkdir(parents=True, exist_ok=True)

    # Copy all files from source images to dest images
    for image_file in source_images.iterdir():
        if image_file.is_file():
            shutil.copy2(image_file, dest_images / image_file.name)
            images_copied += 1

    return images_copied


def compile_component_markdown(
    component_data: dict, content_base_path: Path
) -> tuple[str, str]:
    """
    Compile a single component's markdown file with frontmatter

    Args:
        component_data: Dictionary with component metadata and file paths
        content_base_path: Base path to the content directory

    Returns:
        Tuple of (complete markdown string with frontmatter and content, component_folder_name)
    """
    # Get component folder name from the first file path
    usage_path = component_data.get("usage", "")
    component_folder = usage_path.split("/")[0] if usage_path else ""

    # Create slug from component name for URL paths
    component_slug = (
        component_data["name"].lower().replace(" ", "-").replace("/", "-")
    )

    # Create frontmatter
    frontmatter = "---\n"
    frontmatter += f"title: {component_data['name']}\n"
    frontmatter += (
        f"documentation-status: {component_data['documentation-status']}\n"
    )
    frontmatter += f"type: {component_data['type']}\n"
    frontmatter += f"last-edited: {component_data['last-edited']}\n"
    frontmatter += "---\n\n"

    # Start with h1 title
    markdown_content = f"# {component_data['name']}\n\n"

    # Define the sections we want to include in order
    sections = [
        ("description", "Description"),
        ("anatomy", "Anatomy"),
        ("usage", "Usage"),
        ("examples", "Examples"),
    ]

    # Read and append each section
    for key, heading in sections:
        if key in component_data and component_data[key]:
            file_path = content_base_path / component_data[key]
            content = read_markdown_file(str(file_path))

            if content:
                # Fix image paths to work with the new structure
                # Replace images/ with /content/<component-slug>/images/
                content = content.replace(
                    "](images/", f"](/content/{component_slug}/images/"
                )

                markdown_content += f"## {heading}\n\n"
                markdown_content += content + "\n\n"

    return frontmatter + markdown_content, component_folder


def main():
    """Main compilation function"""
    # Paths
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    content_dir = repo_root / "content"
    schema_file = content_dir / "content-schema.json"
    output_dir = script_dir / "content"

    # Clear and recreate output directory
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(exist_ok=True)

    # Read the schema
    try:
        with open(schema_file, "r", encoding="utf-8") as f:
            components = json.load(f)
    except FileNotFoundError:
        print(f"Error: Schema file not found at {schema_file}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in schema file: {e}")
        return

    print(f"📚 Compiling {len(components)} components...\n")

    total_images = 0

    # Process each component
    for component in components:
        name = component["name"]
        # Create a safe folder name from the component name
        folder_name = name.lower().replace(" ", "-").replace("/", "-")
        component_output_dir = output_dir / folder_name
        component_output_dir.mkdir(parents=True, exist_ok=True)

        print(f"  Processing: {name}")

        # Compile the markdown
        markdown, component_folder = compile_component_markdown(
            component, content_dir
        )

        # Write to index.md in the component folder
        index_path = component_output_dir / "index.md"
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(markdown)

        # Copy images if they exist
        if component_folder:
            source_component_dir = content_dir / component_folder
            images_copied = copy_images(
                source_component_dir, component_output_dir
            )
            if images_copied > 0:
                total_images += images_copied
                print(f"    ✓ Copied {images_copied} images")

    print(f"\n✅ Done! Compiled markdown files saved to: {output_dir}")
    print(f"📁 Total components created: {len(components)}")
    print(f"🖼️  Total images copied: {total_images}")


if __name__ == "__main__":
    main()
