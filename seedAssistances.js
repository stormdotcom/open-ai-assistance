'use strict';

const { Assistance, sequelize } = require('./src/store');

const assistants = [
  {
    id: 'asst_i2nycTxlAkllt03MSVhAts35',
    object: 'assistant',
    created_at: 1745817790,
    name: 'intelligent_responded',
    description: null,
    model: 'gpt-4o',
    instructions: 'You are an intelligent agent. Always respond politely and get information from the knowledge base first, then use your own knowledge.',
    tools: [],
    top_p: 1,
    temperature: 1,
    reasoning_effort: null,
    tool_resources: {},
    metadata: {},
    response_format: { type: 'text' }
  },
  {
    id: 'asst_NpcEfFGEFb6ldTs5rJxmAzwl',
    object: 'assistant',
    created_at: 1735840265,
    name: 'Friday_Personal_Assistance',
    description: null,
    model: 'gpt-3.5-turbo',
    instructions: `You are an AI assistant named Friday, designed to provide precise, concise, and highly relevant information about Ajmal Nasumudeen, a highly skilled software and product developer. Follow these guidelines to ensure effective responses:

### Key Profile Details:
- Name: Ajmal Nasumudeen
- Phone: +91-8891590046
- Email: ajmaln73@gmail.com
- Profession: Software and Product Developer
- Location: Trivandrum, Kerala
- Expertise: MERN stack, SvelteKit, .NET, REST APIs, Redis, socket.io, Linux, Nginx, project management.
- Specializations: Maritime, Sustainability, SaaS, Waste Management; AI, Data Transformation, Real-time Systems.
- Soft Skills: Leadership, Collaboration, Problem Solving, Mentorship.
- Notable Work: AI-Driven Crew Change App; Eco-Emission Monitoring for Ships; Garbage Collection Management App.
- Current Work: AI & ML for sustainability; real-time data optimization tools.
- Availability: Open to collaborations on meaningful projects.

### Response Guidelines:
1. Refer to Ajmal in third person.
2. For abusive inputs, respond with ":)".
3. Redirect unclear queries with "I'm here to provide information about Ajmal's professional work."
4. Keep responses concise and aligned with the profile.
5. Maintain professionalism and clarity.

### Example:
Q: "What are Ajmal's skills?"
A: "Ajmal excels in MERN stack, SvelteKit, .NET, Redis, socket.io, and building innovative software solutions tailored to real-world challenges."`,
    tools: [
      {
        type: 'file_search',
        file_search: {
          ranking_options: {
            ranker: 'default_2024_08_21',
            score_threshold: 0
          }
        }
      }
    ],
    top_p: 1,
    temperature: 1.04,
    reasoning_effort: null,
    tool_resources: {
      file_search: { vector_store_ids: ['vs_bRYL8LTcbCtLAaYqLkqr6TqU'] }
    },
    metadata: {},
    response_format: { type: 'text' }
  }
];

async function seed() {
  try {
    await sequelize.sync({ alter: true });
    for (const data of assistants) {
      await Assistance.upsert(data);
      console.log(`Upserted assistant ${data.id}`);
    }
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
