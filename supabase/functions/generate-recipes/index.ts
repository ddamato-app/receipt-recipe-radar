import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, category } = await req.json();
    console.log('Generating recipes for ingredients:', ingredients, 'Category:', category);

    if (!ingredients || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No ingredients provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ingredientList = ingredients.map((item: any) => 
      `${item.name} (${item.quantity} ${item.unit}, expires: ${item.expiry_date || 'N/A'})`
    ).join('\n');

    const categoryInstructions = {
      quick: 'Focus on recipes that can be prepared in 30 minutes or less. Prioritize simple, fast cooking methods.',
      healthy: 'Focus on nutritious, balanced recipes with plenty of vegetables, lean proteins, and whole grains. Avoid heavy, fried, or overly processed ingredients.',
      comfort: 'Focus on hearty, satisfying comfort food recipes that are warm and filling. Think classic dishes that bring comfort.',
      vegetarian: 'Focus exclusively on vegetarian recipes with no meat, poultry, or seafood. Use plant-based proteins and vegetables.'
    };

    const categoryPrompt = category && categoryInstructions[category as keyof typeof categoryInstructions]
      ? `\n\nIMPORTANT: ${categoryInstructions[category as keyof typeof categoryInstructions]}`
      : '';

    const prompt = `You are a creative chef assistant. Based on the following ingredients available in the user's fridge, suggest 3-5 delicious recipes that can be made primarily with these ingredients.${categoryPrompt}

Available Ingredients:
${ingredientList}

For each recipe, provide:
1. name: A creative, appetizing name
2. description: A brief 1-sentence description
3. cookTime: Estimated cooking time in minutes (number)
4. servings: Number of servings (number)
5. difficulty: "Easy", "Medium", or "Hard"
6. matchingIngredients: List the ingredient names from the fridge that are used
7. additionalIngredients: List any additional ingredients needed (if any)
8. instructions: Array of step-by-step cooking instructions

Return ONLY a valid JSON object with this exact structure:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "cookTime": 30,
      "servings": 4,
      "difficulty": "Easy",
      "matchingIngredients": ["ingredient1", "ingredient2"],
      "additionalIngredients": ["additional1", "additional2"],
      "instructions": ["Step 1", "Step 2"]
    }
  ]
}

Focus on recipes where most ingredients are already available. Be creative but practical.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful chef assistant that suggests recipes based on available ingredients. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate recipes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('AI response:', content);

    // Parse the JSON response
    let recipes;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipes = JSON.parse(jsonMatch[0]);
      } else {
        recipes = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe suggestions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(recipes),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recipes function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
