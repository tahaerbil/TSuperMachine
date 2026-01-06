/**
 * Note Templates
 * Pre-built templates for common note types
 */

export interface NoteTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'productivity' | 'meeting' | 'personal' | 'development';
    content: object; // TipTap JSON format
}

/**
 * Meeting Notes Template
 */
const meetingNotes: NoteTemplate = {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture meeting discussions, decisions, and action items',
    icon: 'users',
    category: 'meeting',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: 'Meeting Notes' }]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
                    { type: 'text', text: new Date().toLocaleDateString() }
                ]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Attendees: ' },
                    { type: 'text', text: '' }
                ]
            },
            {
                type: 'horizontalRule'
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📋 Agenda' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 1' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 2' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 3' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📝 Discussion Notes' }]
            },
            {
                type: 'paragraph',
                content: []
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '✅ Action Items' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 1 - @assignee' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 2 - @assignee' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📅 Next Meeting' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Date: TBD' }]
            }
        ]
    }
};

/**
 * Daily Standup Template
 */
const dailyStandup: NoteTemplate = {
    id: 'daily-standup',
    name: 'Daily Standup',
    description: 'Quick daily status update format',
    icon: 'sun',
    category: 'meeting',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: '🌅 Daily Standup' }]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
                    { type: 'text', text: new Date().toLocaleDateString() }
                ]
            },
            {
                type: 'horizontalRule'
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '✅ Yesterday' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Completed task...' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📋 Today' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Working on...' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🚧 Blockers' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No blockers / Blocked by...' }] }] }
                ]
            }
        ]
    }
};

/**
 * Project Brief Template
 */
const projectBrief: NoteTemplate = {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Outline a new project with goals and timeline',
    icon: 'folder',
    category: 'productivity',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: 'Project Brief' }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🎯 Objective' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Describe the main goal of this project...' }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📊 Scope' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'In scope: ...' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Out of scope: ...' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '👥 Team' }]
            },
            {
                type: 'table',
                content: [
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Role' }] }] },
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }] },
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Responsibility' }] }] }
                        ]
                    },
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lead' }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [] }] }
                        ]
                    }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📅 Timeline' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 1: Planning (Week 1-2)' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 2: Development (Week 3-6)' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 3: Testing (Week 7-8)' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 4: Launch (Week 9)' }] }] }
                ]
            }
        ]
    }
};

/**
 * Bug Report Template
 */
const bugReport: NoteTemplate = {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Document bugs with steps to reproduce',
    icon: 'bug',
    category: 'development',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: '🐛 Bug Report' }]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Reported: ' },
                    { type: 'text', text: new Date().toLocaleDateString() }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Summary' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Brief description of the bug...' }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Steps to Reproduce' }]
            },
            {
                type: 'orderedList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 2' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 3' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Expected Behavior' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'What should happen...' }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Actual Behavior' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'What actually happens...' }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Environment' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'OS: ' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Browser/App Version: ' }] }] },
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Device: ' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Screenshots/Logs' }]
            },
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Attach relevant screenshots or error logs here...' }]
            }
        ]
    }
};

/**
 * Code Review Template
 */
const codeReview: NoteTemplate = {
    id: 'code-review',
    name: 'Code Review',
    description: 'Document code review feedback and suggestions',
    icon: 'code',
    category: 'development',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: '🔍 Code Review' }]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'PR/MR: ' },
                    { type: 'text', text: '#' }
                ]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Author: ' },
                    { type: 'text', text: '' }
                ]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Reviewer: ' },
                    { type: 'text', text: '' }
                ]
            },
            {
                type: 'horizontalRule'
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '✅ Approved / ⚠️ Changes Requested' }]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📝 General Comments' }]
            },
            {
                type: 'paragraph',
                content: []
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🔧 Suggestions' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Suggestion 1' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '⚠️ Issues' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'File: line - Issue description' }] }] }
                ]
            }
        ]
    }
};

/**
 * Weekly Review Template
 */
const weeklyReview: NoteTemplate = {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Reflect on the week and plan ahead',
    icon: 'calendar',
    category: 'personal',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: '📅 Weekly Review' }]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Week of: ' },
                    { type: 'text', text: '' }
                ]
            },
            {
                type: 'horizontalRule'
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🎉 Wins' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'What went well...' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📚 Lessons Learned' }]
            },
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'What could be improved...' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🎯 Next Week Goals' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal 1' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal 2' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal 3' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '💭 Notes' }]
            },
            {
                type: 'paragraph',
                content: []
            }
        ]
    }
};

/**
 * Blank Template
 */
const blank: NoteTemplate = {
    id: 'blank',
    name: 'Blank Note',
    description: 'Start with a clean slate',
    icon: 'file',
    category: 'personal',
    content: {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: []
            }
        ]
    }
};

/**
 * Todo List Template
 */
const todoList: NoteTemplate = {
    id: 'todo-list',
    name: 'Todo List',
    description: 'Track your tasks with a progress indicator',
    icon: 'checkSquare',
    category: 'productivity',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: '✅ Todo List' }]
            },
            {
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
                    { type: 'text', text: new Date().toLocaleDateString() }
                ]
            },
            {
                type: 'progressBar'
            },
            {
                type: 'horizontalRule'
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🔴 High Priority' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Urgent task 1' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Urgent task 2' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🟡 Medium Priority' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 2' }] }] },
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 3' }] }] }
                ]
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '🟢 Low Priority' }]
            },
            {
                type: 'taskList',
                content: [
                    { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Optional task' }] }] }
                ]
            },
            {
                type: 'horizontalRule'
            },
            {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '📝 Notes' }]
            },
            {
                type: 'paragraph',
                content: []
            }
        ]
    }
};

/**
 * All available templates
 */
export const noteTemplates: NoteTemplate[] = [
    blank,
    todoList,
    meetingNotes,
    dailyStandup,
    projectBrief,
    bugReport,
    codeReview,
    weeklyReview
];

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): NoteTemplate | undefined => {
    return noteTemplates.find(t => t.id === id);
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: NoteTemplate['category']): NoteTemplate[] => {
    return noteTemplates.filter(t => t.category === category);
};
