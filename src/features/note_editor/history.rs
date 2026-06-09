use super::document::BlockNode;

pub struct EditHistory {
    undo_stack: Vec<Vec<BlockNode>>,
    redo_stack: Vec<Vec<BlockNode>>,
    max_depth: usize,
}

impl EditHistory {
    pub fn new() -> Self {
        Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
            max_depth: 50,
        }
    }

    /// Records a new document state before an edit is made
    pub fn record_state(&mut self, doc: Vec<BlockNode>) {
        // Only push if different from last recorded state
        if let Some(last) = self.undo_stack.last() {
            if last == &doc {
                return;
            }
        }
        
        self.undo_stack.push(doc);
        if self.undo_stack.len() > self.max_depth {
            self.undo_stack.remove(0);
        }
        self.redo_stack.clear(); // Clear redo on new action
    }

    /// Reverts to previous recorded state, returning the document
    pub fn undo(&mut self, current_doc: Vec<BlockNode>) -> Option<Vec<BlockNode>> {
        if let Some(prev_state) = self.undo_stack.pop() {
            self.redo_stack.push(current_doc);
            Some(prev_state)
        } else {
            None
        }
    }

    /// Restores a reverted state, returning the document
    pub fn redo(&mut self, current_doc: Vec<BlockNode>) -> Option<Vec<BlockNode>> {
        if let Some(next_state) = self.redo_stack.pop() {
            self.undo_stack.push(current_doc);
            Some(next_state)
        } else {
            None
        }
    }
}
