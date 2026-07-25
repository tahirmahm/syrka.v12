import { Router } from 'express';
import openai from '../lib/openai';
import { z } from 'zod';
import { storeData } from '../lib/storage';

const router = Router();

const appSchema = z.object({
  userData: z.any(),
  jobData: z.any(),
});

router.post('/generate', async (req, res) => {
  try {
    const { userData, jobData } = appSchema.parse(req.body);

    let result;
    if (openai) {
      const prompt = `Generate a tailored job application (cover letter and resume adjustments)
      for this user: ${JSON.stringify(userData)}
      applying for this job: ${JSON.stringify(jobData)}.
      Inspired by career-ops style ATS optimization.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      result = JSON.parse(response.choices[0].message.content || '{}');
    } else {
      result = {
        mock: true,
        coverLetter: 'Dear Hiring Manager, I am excited to apply...',
        atsTips: ['Use keywords like AI and Machine Learning']
      };
    }

    await storeData('job_applications', {
      application: result,
      job: jobData,
      status: 'generated'
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate application' });
  }
});

export default router;
