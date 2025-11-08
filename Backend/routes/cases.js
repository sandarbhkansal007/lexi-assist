const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const auth = require('../middleware/auth');
const multer = require('multer');
// This will work correctly now that you have `node-fetch@2` installed
const fetch = require('node-fetch');

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// Helper function for Gemini API call
async function callGemini(prompt, tools = [], generationConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('\n--- FATAL ERROR ---');
    console.error('GEMINI_API_KEY is not set in your .env file.');
    console.error('Please create a backend/.env file and add GEMINI_API_KEY=YOUR_KEY_HERE');
    console.error('Remember to RESTART your server after creating the .env file.');
    console.error('-------------------\n');
    throw new Error('Server configuration error: Missing API key.');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    ...(tools.length > 0 && { tools }),
    ...(Object.keys(generationConfig).length > 0 && { generationConfig }),
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('\n--- Gemini API Error Response ---');
      console.error(JSON.stringify(error, null, 2));
      console.error('---------------------------------\n');
      throw new Error(error.message || 'Gemini API request failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('\n--- Full Error in callGemini ---');
    console.error('Error message:', error.message);
    console.error('------------------------------\n');
    throw error;
  }
}

// Get all cases
router.get('/', auth, async (req, res) => {
  try {
    const cases = await Case.find({ lawyer: req.user.id })
      .populate('client', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single case
router.get('/:id', auth, async (req, res) => {
  try {
    const case_ = await Case.findOne({ _id: req.params.id, lawyer: req.user.id })
      .populate('client', 'name phone email address');
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(case_);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create case
router.post('/', auth, async (req, res) => {
  try {
    const newCase = new Case({
      ...req.body,
      lawyer: req.user.id
    });
    
    const case_ = await newCase.save();
    res.status(201).json(case_);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update case
router.put('/:id', auth, async (req, res) => {
  try {
    const case_ = await Case.findOneAndUpdate(
      { _id: req.params.id, lawyer: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json(case_);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete case
router.delete('/:id', auth, async (req, res) => {
  try {
    const case_ = await Case.findOneAndDelete({ _id: req.params.id, lawyer: req.user.id });
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }
    res.json({ message: 'Case deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// --- THIS IS THE FIXED ROUTE ---
// Search similar cases (REAL IMPLEMENTATION)
router.post('/:id/similar', auth, async (req, res) => {
  try {
    const case_ = await Case.findOne({ _id: req.params.id, lawyer: req.user.id });
    if (!case_) return res.status(404).json({ message: 'Case not found' });

    // NEW, STRICTER PROMPT FOR JSON
    const prompt = `
      You are a legal research assistant. Find 3-5 similar Indian legal cases to the following:
      Case Title: ${case_.title}
      Case Type: ${case_.caseType}
      Description: ${case_.description}
      
      Your response MUST be a valid JSON array of objects, and nothing else.
      Do not include markdown \`\`\`json\`\`\` tags or any explanatory text.
      
      The JSON format for each object must be:
      {
        "caseTitle": "The full case title",
        "citation": "The official citation",
        "verdict": "A one-sentence summary of the verdict or key ruling."
      }
      
      Example of a perfect response:
      [
        {"caseTitle": "Kesavananda Bharati v. State of Kerala", "citation": "(1973) 4 SCC 225", "verdict": "The Supreme Court held that Parliament cannot alter the basic structure of the Constitution."},
        {"caseTitle": "Maneka Gandhi v. Union of India", "citation": "AIR 1978 SC 597", "verdict": "The Court held that the 'procedure established by law' under Article 21 must be fair, just, and reasonable."}
      ]
    `;
    
    // REMOVED the generationConfig (jsonSchema) from the call
    // We are ONLY passing the tool now
    const result = await callGemini(
      prompt,
      [{ "google_search": {} }] 
    );

    let generatedJsonText = result.candidates[0].content.parts[0].text;
    
    // Clean the text in case the AI wraps it in markdown
    generatedJsonText = generatedJsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    let similarCases;
    try {
      // Parse the text response as JSON
      similarCases = JSON.parse(generatedJsonText);
    } catch (parseError) {
      console.error("--- Gemini JSON Parse Error ---");
      console.error("The AI returned non-JSON text:", generatedJsonText);
      console.error("Parse error:", parseError.message);
      console.error("-------------------------------");
      throw new Error("AI assistant returned an invalid format. Please try again.");
    }

    case_.similarCases = similarCases;
    await case_.save();
    
    res.json(similarCases);
  } catch (err) {
    console.error(`\n--- CRASH in POST /:id/similar ---`);
    console.error(err);
    console.error(`----------------------------------\n`);
    res.status(500).json({ message: 'Failed to find similar cases.', error: err.message });
  }
});
// --- END OF FIXED ROUTE ---


// Generate summary (This route was already correct)
router.post('/:id/summary', auth, async (req, res) => {
  try {
    const case_ = await Case.findOne({ _id: req.params.id, lawyer: req.user.id });
    if (!case_) return res.status(404).json({ message: 'Case not a found' });

    const prompt = `
      You are an expert legal assistant. Summarize the following case description into a concise, 
      2-3 sentence summary suitable for a case file.
      
      Case Title: ${case_.title}
      Case Type: ${case_.caseType}
      Court: ${case_.court}
      Description: ${case_.description}
      
      Generate only the summary text.
    `;
    
    const result = await callGemini(prompt);
    
    const summary = result.candidates[0].content.parts[0].text;
    
    case_.summary = summary;
    await case_.save();
    
    res.json({ summary: summary });
  } catch (err) {
    console.error(`\n--- CRASH in POST /:id/summary ---`);
    console.error(err);
    console.error(`----------------------------------\n`);
    res.status(500).json({ message: 'Failed to generate summary.', error: err.message });
  }
});

// Document Upload
router.post('/:id/document', auth, upload.single('document'), async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.id);

    if (!case_ || case_.lawyer.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const newDocument = {
      name: file.originalname,
      url: file.path, 
      uploadedAt: new Date()
    };
    
    case_.documents.push(newDocument);
    await case_.save();

    res.json(case_);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Document Deletion
router.delete('/:id/document/:docId', auth, async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.id);

    if (!case_ || case_.lawyer.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Case not found' });
    }

    case_.documents.pull({ _id: req.params.docId });
    
    // TODO: fs.unlinkSync(document.url);
    
    await case_.save();

    res.json(case_);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;