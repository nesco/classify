# Allobrain Classifier

A configurable text classification system powered by LLM that learns from user feedback. Define categories, classify text in real-time, correct mistakes, and watch the system improve through dynamic few-shot learning.

## Quick Start (5 minutes)

### Prerequisites

- [Bun](https://bun.sh/) installed
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone and install
git clone <repository-url>
cd allobrain-classifier
bun install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and add: ANTHROPIC_API_KEY=sk-ant-...

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### First Classification

1. **Create a classifier** - Click "New Classifier", name it "Email Triage"
2. **Add categories** - Create "Urgent", "Important", and "General" with clear descriptions
3. **Classify text** - Paste an email and click "Classify"
4. **Provide feedback** - If wrong, click "Incorrect" and select the right category
5. **Watch it learn** - The corrected text becomes an example for future classifications

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│                                                                 │
│  ┌─────────────┐     ┌────────────────────────────────────────┐ │
│  │ Classifier  │     │     Classifier Detail Page             │ │
│  │    List     │     │  ┌──────────────┐ ┌──────────────────┐ │ │
│  │   (home)    │────▶│  │Classification│ │    Category      │ │ │
│  │             │     │  │  + History   │ │   Management     │ │ │
│  └─────────────┘     │  └──────────────┘ └──────────────────┘ │ │
│    /                 └────────────────────────────────────────┘ │
│                        /classifier/[id]                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Next.js API Routes                         │
│  /api/classify    /api/feedback    /api/suggest-category        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    BAML Prompt Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Classify(categories[], text) → {categoryId, confidence} │   │
│  │  SuggestCategory(examples[]) → {name, description}       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Claude API (Sonnet 4)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. BAML for Prompt Engineering

Prompts are defined in `.baml` files with:

- **Type-safe inputs/outputs** - Generated TypeScript ensures correctness
- **Jinja templating** - Dynamic prompt construction with loops and conditionals
- **Separation of concerns** - Prompts live outside application code
- **Testability** - BAML files include test cases

#### 2. Dynamic Few-Shot Learning

The system learns without retraining:

```
User Feedback → Example Added to Category → Better Future Predictions
```

When a user marks a classification as incorrect:

1. The text is added to the correct category's examples
2. The LLM sees these examples in subsequent prompts
3. Classification accuracy improves over time

#### 3. No Dataset Required

The system works with zero examples:

- **Zero-shot**: Category name + description is enough to start
- **Few-shot**: User corrections automatically build the example set
- **Self-improving**: Every interaction makes it smarter

---

## Project Structure

```
app/
├── page.tsx                    # Classifier list
├── classifier/[id]/page.tsx    # Main classifier UI
└── api/
    ├── classifiers/            # CRUD operations
    ├── classify/route.ts       # LLM classification
    ├── feedback/route.ts       # Learning from corrections
    └── suggest-category/       # LLM category suggestion

components/
├── classifier-list.tsx         # Home page
├── classifier-detail.tsx       # Classification interface
└── ui/                         # shadcn components

lib/
├── llm.ts                      # BAML client wrapper
├── storage.ts                  # JSON persistence
├── types.ts                    # TypeScript interfaces
└── constants.ts                # Shared constants

baml_src/
├── classifier.baml             # Classify + SuggestCategory prompts
├── clients.baml                # Claude client config
└── generators.baml             # Code generation config

data/
└── classifiers.json            # Persistent storage
```

---

## Commands

```bash
bun dev              # Development server
bun run build        # Production build
bun run qa           # TypeScript + ESLint + Build + Prettier
bun run baml:generate # Regenerate BAML client
```

---

## Example Use Cases

### Customer Support Triage

Categories: Urgent, Important, General, Spam

- "Server down, customers can't access" → Urgent (high confidence)
- "How do I reset my password?" → General (high confidence)
- "Your product is garbage" → Important (needs human review)

### Content Moderation

Categories: Safe, Review Needed, Block

- AI learns from moderator decisions
- Borderline cases flagged with low confidence

### Document Classification

Categories: Invoice, Contract, Report, Correspondence

- Works with minimal examples
- Learns company-specific patterns from feedback

---

## Technical Stack

| Component   | Technology                   |
| ----------- | ---------------------------- |
| Framework   | Next.js 16 (App Router)      |
| Styling     | Tailwind CSS v4, shadcn/ui   |
| LLM         | Claude Sonnet 4 via BAML     |
| Runtime     | Bun                          |
| Storage     | JSON file (easily swappable) |
| Type Safety | TypeScript strict mode       |
