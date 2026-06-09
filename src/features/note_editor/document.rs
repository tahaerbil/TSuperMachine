#[derive(Clone, Debug, PartialEq)]
pub enum BlockNode {
    Paragraph(Vec<InlineNode>),
    Heading { level: u32, content: Vec<InlineNode> },
    BulletList(Vec<Vec<InlineNode>>),
    CodeBlock { language: String, code: String },
}

#[derive(Clone, Debug, PartialEq)]
pub enum InlineNode {
    Text { text: String, marks: Vec<MarkType> },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MarkType {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
}

// Convert Markdown string to AST nodes
pub fn parse_markdown(markdown: &str) -> Vec<BlockNode> {
    let mut blocks = Vec::new();
    let mut lines = markdown.lines().peekable();
    
    while let Some(line) = lines.next() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        // 1. Heading
        if trimmed.starts_with('#') {
            let level = trimmed.chars().take_while(|&c| c == '#').count() as u32;
            let text = trimmed.trim_start_matches('#').trim();
            blocks.push(BlockNode::Heading {
                level,
                content: parse_inline(text),
            });
            continue;
        }

        // 2. Code Block
        if trimmed.starts_with("```") {
            let language = trimmed.trim_start_matches("```").trim().to_string();
            let mut code_lines = Vec::new();
            while let Some(next_line) = lines.peek() {
                if next_line.trim().starts_with("```") {
                    let _ = lines.next(); // Consume closing tag
                    break;
                }
                code_lines.push(lines.next().unwrap());
            }
            blocks.push(BlockNode::CodeBlock {
                language,
                code: code_lines.join("\n"),
            });
            continue;
        }

        // 3. Bullet List Grouping
        if trimmed.starts_with('-') || trimmed.starts_with('*') {
            let mut list_items = Vec::new();
            // Parse first item
            list_items.push(parse_inline(trimmed[1..].trim()));
            
            // Look ahead for more list items
            while let Some(next_line) = lines.peek() {
                let next_trimmed = next_line.trim();
                if next_trimmed.starts_with('-') || next_trimmed.starts_with('*') {
                    let item_line = lines.next().unwrap().trim();
                    list_items.push(parse_inline(item_line[1..].trim()));
                } else {
                    break;
                }
            }
            blocks.push(BlockNode::BulletList(list_items));
            continue;
        }

        // 4. Default: Paragraph
        blocks.push(BlockNode::Paragraph(parse_inline(trimmed)));
    }

    if blocks.is_empty() {
        blocks.push(BlockNode::Paragraph(vec![InlineNode::Text {
            text: String::new(),
            marks: Vec::new(),
        }]));
    }

    blocks
}

// Convert AST nodes to Markdown string
pub fn serialize_markdown(blocks: &[BlockNode]) -> String {
    let mut out = String::new();
    for block in blocks {
        match block {
            BlockNode::Heading { level, content } => {
                for _ in 0..*level {
                    out.push('#');
                }
                out.push(' ');
                out.push_str(&serialize_inline(content));
                out.push_str("\n\n");
            }
            BlockNode::CodeBlock { language, code } => {
                out.push_str("```");
                out.push_str(language);
                out.push('\n');
                out.push_str(code);
                out.push_str("\n```\n\n");
            }
            BlockNode::BulletList(items) => {
                for item in items {
                    out.push_str("- ");
                    out.push_str(&serialize_inline(item));
                    out.push('\n');
                }
                out.push('\n');
            }
            BlockNode::Paragraph(content) => {
                out.push_str(&serialize_inline(content));
                out.push_str("\n\n");
            }
        }
    }
    out.trim().to_string()
}

// Parse text for inline markers: **bold**, *italic*, ~~strike~~, `code`
fn parse_inline(text: &str) -> Vec<InlineNode> {
    // A simplified inline parser for formatting demo
    let mut nodes = Vec::new();
    let mut current_text = String::new();
    let mut active_marks = Vec::new();
    
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    
    while i < chars.len() {
        // Double Asterisk: Bold
        if i + 1 < chars.len() && chars[i] == '*' && chars[i+1] == '*' {
            if !current_text.is_empty() {
                nodes.push(InlineNode::Text { text: current_text.clone(), marks: active_marks.clone() });
                current_text.clear();
            }
            if active_marks.contains(&MarkType::Bold) {
                active_marks.retain(|&m| m != MarkType::Bold);
            } else {
                active_marks.push(MarkType::Bold);
            }
            i += 2;
            continue;
        }

        // Single Asterisk: Italic
        if chars[i] == '*' {
            if !current_text.is_empty() {
                nodes.push(InlineNode::Text { text: current_text.clone(), marks: active_marks.clone() });
                current_text.clear();
            }
            if active_marks.contains(&MarkType::Italic) {
                active_marks.retain(|&m| m != MarkType::Italic);
            } else {
                active_marks.push(MarkType::Italic);
            }
            i += 1;
            continue;
        }

        // Double Tilde: Strikethrough
        if i + 1 < chars.len() && chars[i] == '~' && chars[i+1] == '~' {
            if !current_text.is_empty() {
                nodes.push(InlineNode::Text { text: current_text.clone(), marks: active_marks.clone() });
                current_text.clear();
            }
            if active_marks.contains(&MarkType::Strikethrough) {
                active_marks.retain(|&m| m != MarkType::Strikethrough);
            } else {
                active_marks.push(MarkType::Strikethrough);
            }
            i += 2;
            continue;
        }

        // Backtick: Inline Code
        if chars[i] == '`' {
            if !current_text.is_empty() {
                nodes.push(InlineNode::Text { text: current_text.clone(), marks: active_marks.clone() });
                current_text.clear();
            }
            if active_marks.contains(&MarkType::Code) {
                active_marks.retain(|&m| m != MarkType::Code);
            } else {
                active_marks.push(MarkType::Code);
            }
            i += 1;
            continue;
        }

        current_text.push(chars[i]);
        i += 1;
    }

    if !current_text.is_empty() {
        nodes.push(InlineNode::Text { text: current_text, marks: active_marks });
    }

    if nodes.is_empty() {
        nodes.push(InlineNode::Text { text: String::new(), marks: Vec::new() });
    }

    nodes
}

fn serialize_inline(nodes: &[InlineNode]) -> String {
    let mut out = String::new();
    for node in nodes {
        match node {
            InlineNode::Text { text, marks } => {
                let mut prefix = String::new();
                let mut suffix = String::new();
                if marks.contains(&MarkType::Bold) {
                    prefix.push_str("**");
                    suffix.insert_str(0, "**");
                }
                if marks.contains(&MarkType::Italic) {
                    prefix.push_str("*");
                    suffix.insert_str(0, "*");
                }
                if marks.contains(&MarkType::Strikethrough) {
                    prefix.push_str("~~");
                    suffix.insert_str(0, "~~");
                }
                if marks.contains(&MarkType::Code) {
                    prefix.push_str("`");
                    suffix.insert_str(0, "`");
                }
                out.push_str(&prefix);
                out.push_str(text);
                out.push_str(&suffix);
            }
        }
    }
    out
}
