import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadSyllabus = (board) => {
    const filePath = path.join(__dirname, '..', 'syllabus', `${board}_board_syllabus.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

router.get('/subjects/:board/:class', (req, res) => {
    try {
        const { board, class: className } = req.params;
        const syllabus = loadSyllabus(board);
        const classData = syllabus.find(c => c.class === className);
        
        if (!classData) return res.status(404).json({ error: 'Class not found' });
        
        const subjects = classData.subjects.map(s => ({
            name: s.name,
            chapters: s.chapters.map(c => c.title)
        }));
        
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load subjects' });
    }
});

router.post('/generate', (req, res) => {
    try {
        const { board, class: className, selections } = req.body;
        const syllabus = loadSyllabus(board);
        const classData = syllabus.find(c => c.class === className);
        
        if (!classData) return res.status(404).json({ error: 'Class not found' });
        
        const customBook = {
            title: `Custom Book - Class ${className}`,
            board, class: className, subjects: []
        };
        
        selections.forEach(selection => {
            const subject = classData.subjects.find(s => s.name.en === selection.subject);
            if (!subject) return;
            
            const customSubject = { name: subject.name, chapters: [] };
            
            selection.chapters.forEach(chapterTitle => {
                const chapter = subject.chapters.find(c => c.title.en === chapterTitle);
                if (!chapter) return;
                
                const customChapter = { title: chapter.title, content: {} };
                
                if (selection.includeTypes.includes('mcqs')) 
                    customChapter.content.mcqs = chapter.mcqs || [];
                if (selection.includeTypes.includes('short_questions')) {
                    customChapter.content.short_questions = chapter.short_questions || [];
                    customChapter.content.short_questions_ur = chapter.short_questions_ur || [];
                }
                if (selection.includeTypes.includes('long_questions')) {
                    customChapter.content.long_questions = chapter.long_questions || [];
                    customChapter.content.long_questions_ur = chapter.long_questions_ur || [];
                }
                
                customSubject.chapters.push(customChapter);
            });
            
            if (customSubject.chapters.length > 0) 
                customBook.subjects.push(customSubject);
        });
        
        res.json(customBook);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate book' });
    }
});

export default router;