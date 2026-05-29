import React, { useState } from 'react';
import Head from 'next/head';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Sparkle as AutoAwesomeIcon } from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { JobCategory, JOB_CATEGORY_LABELS } from '../../libs/enums';

interface MatchResult {
  freelancerName: string;
  matchScore: number;
  reason: string;
  skills: string[];
  estimatedRate: string;
}

const AiMatchPage = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [category, setCategory] = useState<JobCategory>(JobCategory.VISUALS);
  const [budget, setBudget] = useState<number[]>([100, 500]);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState('');

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);
    setRawResponse('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local');

      const prompt = `You are an AI assistant for BuFu (bufu.uz), a real estate freelance platform in Uzbekistan.

A client needs help with the following job:
- Category: ${JOB_CATEGORY_LABELS[category]}
- Budget range: $${budget[0]} - $${budget[1]}
- Job description: ${jobDescription}

Based on this, suggest 3 ideal freelancer profiles that would be a great match. For each, provide:
1. A realistic freelancer name (Uzbek names)
2. A match score (0-100)
3. A short reason why they are a great match (1-2 sentences)
4. 3-4 relevant skills they should have
5. An estimated hourly rate that fits within the budget

Respond ONLY with valid JSON in this exact format:
[
  {
    "freelancerName": "Name Here",
    "matchScore": 95,
    "reason": "Short reason here.",
    "skills": ["skill1", "skill2", "skill3"],
    "estimatedRate": "$25/hr"
  }
]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );

      if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      setRawResponse(text);

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Could not parse AI response. Please try again.');

      const parsed: MatchResult[] = JSON.parse(jsonMatch[0]);
      setResults(parsed);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>AI Match — BuFu</title></Head>

      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <AutoAwesomeIcon size={28} color="#4f46e5" />
        <Typography variant="h5" fontWeight={800}>AI Freelancer Match</Typography>
      </Stack>
      <Typography color="text.secondary" fontSize={14} mb={4}>
        Describe your project and our AI will suggest the best freelancers for the job.
      </Typography>

      <Grid container spacing={4}>
        {/* Left: Form */}
        <Grid item xs={12} md={5}>
          <Box className="card-base" sx={{ p: 4 }}>
            <form onSubmit={handleMatch}>
              <Stack spacing={3}>
                <Box>
                  <Typography fontSize={13} fontWeight={600} mb={1}>Service Category</Typography>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as JobCategory)}
                    fullWidth
                    size="small"
                  >
                    {Object.values(JobCategory).map((cat) => (
                      <MenuItem key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Typography fontSize={13} fontWeight={600} mb={2}>
                    Budget Range: ${budget[0]} — ${budget[1]}
                  </Typography>
                  <Slider
                    value={budget}
                    onChange={(_, val) => setBudget(val as number[])}
                    min={50}
                    max={2000}
                    step={50}
                    valueLabelDisplay="auto"
                    sx={{ color: '#4f46e5' }}
                  />
                </Box>

                <Box>
                  <Typography fontSize={13} fontWeight={600} mb={1}>Job Description *</Typography>
                  <TextField
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Describe what you need... e.g. HDR photos and drone footage for a 3-bedroom apartment in Tashkent for listing on OLX."
                    fullWidth
                    multiline
                    rows={5}
                    size="small"
                    required
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !jobDescription.trim()}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}
                >
                  {loading ? 'Finding Matches...' : 'Find Best Matches'}
                </Button>
              </Stack>
            </form>
          </Box>
        </Grid>

        {/* Right: Results */}
        <Grid item xs={12} md={7}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!results && !loading && !error && (
            <Box
              sx={{
                height: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #e2e8f0',
                borderRadius: 3,
                color: '#94a3b8',
              }}
            >
              <AutoAwesomeIcon size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
              <Typography fontSize={14}>Your AI-matched freelancers will appear here</Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 2 }}>
              <CircularProgress sx={{ color: '#4f46e5' }} />
              <Typography fontSize={13} color="text.secondary">AI is analyzing your requirements...</Typography>
            </Box>
          )}

          {results && (
            <Stack spacing={2}>
              <Typography fontSize={13} color="text.secondary" fontWeight={600}>
                Top {results.length} matches for your project
              </Typography>
              {results.map((match, index) => (
                <Box key={index} className="card-base" sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#cd7f32',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'white',
                          }}
                        >
                          #{index + 1}
                        </Box>
                        <Typography fontWeight={700} fontSize={15}>{match.freelancerName}</Typography>
                      </Stack>
                      <Typography fontSize={12} color="text.secondary" mt={0.5}>{match.estimatedRate}</Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: match.matchScore >= 90 ? '#dcfce7' : match.matchScore >= 75 ? '#fef9c3' : '#fee2e2',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        fontSize={13}
                        fontWeight={800}
                        color={match.matchScore >= 90 ? '#16a34a' : match.matchScore >= 75 ? '#ca8a04' : '#dc2626'}
                      >
                        {match.matchScore}% match
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography fontSize={13} color="text.secondary" mb={1.5}>{match.reason}</Typography>

                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {match.skills.map((skill) => (
                      <Box
                        key={skill}
                        sx={{ px: 1.5, py: 0.25, bgcolor: '#eef2ff', color: '#4f46e5', borderRadius: 1, fontSize: 11, fontWeight: 600 }}
                      >
                        {skill}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default withLayoutBasic(AiMatchPage);
