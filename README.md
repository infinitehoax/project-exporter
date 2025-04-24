# Project Exporter for AI 🚀

[GitHub](https://github.com/infinitehoax/project-exporter) | [Sponsor](https://github.com/sponsors/infinitehoax) | [Report Issue](https://github.com/infinitehoax/project-exporter/issues)

Export your entire project in AI-friendly formats with one click. Get better, more accurate assistance from ChatGPT, Claude, and GitHub Copilot by providing complete project context!

## ✨ Features

- **One-Click Export**: Export your entire project structure and contents instantly from the status bar
- **Multiple Formats**:
  - 📝 Markdown - Perfect for ChatGPT/Claude
  - 🔄 JSON - For programmatic processing
  - 📄 Plain Text - Universal compatibility
- **Smart Filtering**: Automatically excludes node_modules, binaries, and other unnecessary files
- **Quick Export**: Instantly export current file or selection
- **Easy Access**: Status bar button and command palette integration

## 🚀 Quick Start

1. Click the "Export for AI" button in status bar
2. Choose format (Markdown/JSON/Text)
3. Select save location
4. Paste into your AI tool!

## 💡 Example Use Cases

- Get better AI code assistance by sharing full project context
- Easy code reviews - share relevant files with proper structure
- Quick documentation - export project structure and contents
- Team collaboration - share code context efficiently

## Configuration

You can customize file exclusions in your VS Code settings:

1. Open VS Code Settings (Ctrl+,)
2. Search for "Project Exporter"
3. Add custom exclusion patterns under "Project Exporter: Custom Exclusions"

Example settings.json:
```json
{
    "projectExporter.customExclusions": [
        "**/temp/**",
        "**/*.private.*",
        "**/secrets/**"
    ]
}
```

Patterns use glob syntax similar to .gitignore patterns.

## ❤️ Support Development

If you find this extension helpful, consider:
- ⭐ Star the [GitHub repository](https://github.com/infinitehoax/project-exporter)
- 💖 [Sponsor this project](https://github.com/sponsors/infinitehoax)
- 🐛 [Report issues](https://github.com/infinitehoax/project-exporter/issues) and suggest features

Your support helps keep this extension maintained and improved!

## 💚 Support

- Found a bug? [Open an issue](https://github.com/infinitehoax/project-exporter/issues)
- Have a suggestion? [Let us know](https://github.com/infinitehoax/project-exporter/issues)
- Need help? Create a [support ticket](https://github.com/infinitehoax/project-exporter/issues)
