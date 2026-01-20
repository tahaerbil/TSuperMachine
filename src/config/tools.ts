
import {
    Calculator,
    StickyNote,
    FileSpreadsheet,
    Box,
    PenTool,
    Settings,
    Image,
    FileText,
    Presentation,
    FolderKanban,
    Bot,
    Archive,
    type LucideIcon
} from 'lucide-react';
import type { WidgetType } from '../store/store';

export interface ToolConfig {
    type: WidgetType;
    Icon: LucideIcon;
    labelKey: string;
}

export const TOOL_CONFIG: ToolConfig[] = [
    { type: 'NOTE', Icon: StickyNote, labelKey: 'app.toolbar.note' },
    { type: 'CALCULATOR', Icon: Calculator, labelKey: 'app.toolbar.calculator' },
    { type: 'CAD_2D', Icon: PenTool, labelKey: 'app.toolbar.cad2d' },
    { type: 'CAD_3D', Icon: Box, labelKey: 'app.toolbar.cad3d' },
    { type: 'SPREADSHEET', Icon: FileSpreadsheet, labelKey: 'app.toolbar.spreadsheet' },
    { type: 'IMAGE', Icon: Image, labelKey: 'app.toolbar.image' },
    { type: 'PDF', Icon: FileText, labelKey: 'app.toolbar.pdf' },
    { type: 'PRESENTATION', Icon: Presentation, labelKey: 'app.toolbar.presentation' },
    { type: 'PROJECT', Icon: FolderKanban, labelKey: 'app.toolbar.project' },
    { type: 'DATA_VAULT', Icon: Archive, labelKey: 'app.toolbar.vault' },
    { type: 'AI_ASSISTANT', Icon: Bot, labelKey: 'app.toolbar.ai' },
    { type: 'SETTINGS', Icon: Settings, labelKey: 'app.toolbar.settings' },
];
