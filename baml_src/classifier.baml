// Category definition for classification
class Category {
  id string
  name string
  description string
  examples string[]
}

// Classification confidence levels
enum Confidence {
  Low @alias("low")
  Medium @alias("medium")
  High @alias("high")
}

// Output of the classification function
class ClassifyOutput {
  categoryId string
  confidence Confidence
  explanation string
}

// Output of the category suggestion function
class CategorySuggestion {
  name string
  description string
}

// Classify text into one of the provided categories
function Classify(categories: Category[], text: string) -> ClassifyOutput {
  client Claude
  prompt #"
    You are a classification assistant. Analyze the text and choose the most appropriate category.

    ## Categories

    {% for category in categories %}
    ### {{ category.name }} (id: {{ category.id }})
    {{ category.description }}
    {% if category.examples | length > 0 %}
    Examples:
    {% for example in category.examples %}
    - "{{ example }}"
    {% endfor %}
    {% endif %}

    {% endfor %}

    ## Text to classify

    "{{ text }}"

    ## Instructions

    Choose the most appropriate category for this text and explain your reasoning.

    {{ ctx.output_format }}
  "#
}

// Suggest a category name and description based on example texts
function SuggestCategory(examples: string[], existingCategories: Category[]) -> CategorySuggestion {
  client Claude
  prompt #"
    You are helping create a new classification category based on example texts.

    {% if existingCategories | length > 0 %}
    ## Existing categories (for context, the new category should be different)

    {% for cat in existingCategories %}
    - **{{ cat.name }}**: {{ cat.description }}
    {% endfor %}

    {% endif %}
    ## Example texts for the new category

    {% for ex in examples %}
    {{ loop.index }}. "{{ ex }}"
    {% endfor %}

    ## Instructions

    Analyze these examples and suggest a category name and description that captures their common theme.
    The name should be short (1-3 words). The description should be clear and help an AI classify similar texts.

    {{ ctx.output_format }}
  "#
}

// Tests
test classify_urgent {
  functions [Classify]
  args {
    categories [
      {
        id "cat-1"
        name "Urgent"
        description "Urgent messages requiring immediate attention"
        examples ["RESPOND NOW", "EMERGENCY"]
      },
      {
        id "cat-2"
        name "Casual"
        description "Casual, non-urgent messages"
        examples ["Hey, how are you?", "What's up?"]
      }
    ]
    text "PLEASE COME IMMEDIATELY"
  }
}

test suggest_category {
  functions [SuggestCategory]
  args {
    examples ["Thank you so much!", "Thanks for your help", "I really appreciate it"]
    existingCategories []
  }
}
