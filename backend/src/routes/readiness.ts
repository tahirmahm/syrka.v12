import { Router } from 'express';
import openai from '../lib/openai';
import { z } from 'zod';
import { storeData } from '../lib/storage';

const router = Router();

const scoreSchema = z.object({
  userSkills: z.array(z.string()),
  jobRequirements: z.array(z.string()),
});

router.post('/score', async (req, res) => {
  try {
    const { userSkills, jobRequirements } = scoreSchema.parse(req.body);

    let result;
    if (openai) {
      const prompt = `Compare these user skills: ${JSON.stringify(userSkills)}
      with these job requirements: ${JSON.stringify(jobRequirements)}.
      Provide a readiness score (0-100), missing skills, and a weekly improvement plan.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      result = JSON.parse(response.choices[0].message.content || '{}');
    } else {
      result = {
        mock: true,
        score: 75,
        missing: ['Deep Learning'],
        plan: ['Study CNNs', 'Practice PyTorch']
      };
    }

    await storeData('user_skills', { skills: userSkills });
    await storeData('readiness_scores', { score: result, jobRequirements });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to calculate readiness' });
  }
});

export default router;
