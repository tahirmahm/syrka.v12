import { Router } from 'express';
import openai from '../lib/openai';
import { z } from 'zod';
import { storeData } from '../lib/storage';

const router = Router();

const extractSchema = z.object({
  text: z.string(),
  type: z.enum(['moodle', 'job']),
});

router.post('/extract', async (req, res) => {
  try {
    const { text, type } = extractSchema.parse(req.body);

    let result;
    if (openai) {
      const prompt = type === 'moodle'
        ? `Extract courses, modules, and skills from this Moodle content: ${text}`
        : `Extract job title, description, and required skills from this job listing: ${text}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      result = JSON.parse(response.choices[0].message.content || '{}');
    } else {
      result = {
        mock: true,
        type,
        skills: ['AI', 'Data Analysis'],
        message: 'Mock data (No API Key)'
      };
    }

    await storeData(type === 'moodle' ? 'course_analysis' : 'job_analysis', result);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to extract skills' });
  }
});

export default router;
