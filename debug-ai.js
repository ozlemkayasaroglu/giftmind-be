#!/usr/bin/env node

const { generateGiftIdeas } = require('./services/aiGiftRecommender');

const testPersona = {
  id: 'test-123',
  name: 'Alice Johnson',
  birth_date: '1985-03-20',
  interests: ['reading', 'cooking', 'yoga', 'gardening'],
  notes: ['Loves mystery novels', 'Vegetarian chef', 'Practices daily meditation']
};

async function testAI() {
  console.log('🧪 Testing AI Gift Recommender...');
  console.log('Test Persona:', testPersona);
  
  try {
    const result = await generateGiftIdeas(testPersona);
    console.log('\n✅ AI Result:');
    console.log('Success:', result.success);
    console.log('PersonaName:', result.personaName);
    console.log('Age:', result.age);
    console.log('AgeCategory:', result.ageCategory);
    console.log('Recommendations:', result.recommendations);
    console.log('AI Generated:', result.aiGenerated);
    console.log('Generated At:', result.generatedAt);
    console.log('Total Options:', result.totalOptions);
  } catch (error) {
    console.error('❌ AI Error:', error);
  }
}

testAI();
