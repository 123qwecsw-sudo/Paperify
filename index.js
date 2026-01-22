import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bookRoutes from './routes/book.js';

// ... (your existing imports)

const app = express();
const PORT = process.env.PORT || 3000;

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NEW RULE: Serve static files from the public folder
// This allows <img src="/images/name.png"> to work correctly
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
// ... (rest of your existing middleware and routes)

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));

// Logic to load JSON files from /syllabus folder
function loadBoardData(board) {
    try {
        const safeBoard = board.trim().toLowerCase();
        const filePath = path.join(__dirname, 'syllabus', `${safeBoard}_board_syllabus.json`);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return [];
        }

        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${board} board data:`, error);
        return [];
    }
}

// Routes
app.use('/book', bookRoutes);

// Page Routes
app.get('/', (req, res) => {
    res.render('Welcomepage'); // Make sure this file is exactly Welcomepage.ejs
});

app.get('/board', (req, res) => res.render('board'));
app.get('/paper', (req, res) => res.render('classes')); 
app.get('/group', (req, res) => res.render('groups'));
app.get('/books', (req, res) => res.render('books'));
app.get('/questions', (req, res) => res.render('questions'));
app.get('/pape', (req, res) => res.render('paper-generator'));
app.get('/courses', (req, res) => res.render('Courses')); // Courses.ejs file
app.get('/ans', (req, res) => res.render('ans'));

// API: Get full syllabus for a board
app.get('/api/data/:board', (req, res) => {
    const data = loadBoardData(req.params.board);
    res.json(data);
});

// API: Filtered subjects for books page
app.get('/api/subjects/:board/:class/:group', (req, res) => {
    const { board, class: className, group } = req.params;
    const data = loadBoardData(board);

    const classData = data.find(c => c.class.toString() === className.toString());
    if (!classData) return res.json([]);

    const subjects = classData.subjects.filter(subject => {
        const name = subject.name.en.toLowerCase().trim();
        const science = ['biology', 'chemistry', 'physics', 'mathematics', 'computer science'];
        const arts = ['civics', 'food and nutrition', 'general mathematics', 'general science', 'home economics', 'pakistan studies', 'physical education', 'poultry farming'];

        if (group.toLowerCase() === 'science') return science.includes(name);
        if (group.toLowerCase() === 'arts') return arts.includes(name);
        return false;
    });

    res.json(subjects);
});

// API: Subjects for a board+class (no group) - used for class 11/12 flow
app.get('/api/subjects/:board/:class', (req, res) => {
    const { board, class: className } = req.params;
    const data = loadBoardData(board);
    const classData = data.find(c => c.class.toString() === className.toString());
    if (!classData) return res.json([]);
    res.json(classData.subjects || []);
});

// API: Get chapters for a specific subject
app.get('/api/chapters/:board/:class/:subject', (req, res) => {
    const { board, class: className, subject } = req.params;
    const data = loadBoardData(board);

    const classData = data.find(c => c.class.toString() === className.toString());
    if (!classData) return res.json([]);

    const subjectData = classData.subjects.find(s => 
        s.name.en.toLowerCase().trim() === decodeURIComponent(subject).toLowerCase().trim()
    );

    if (!subjectData) return res.json([]);

    const chapters = subjectData.chapters.map(ch => ({
        title: ch.chapter.en,
        title_ur: ch.chapter.ur || ''
    }));

    res.json(chapters);
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
