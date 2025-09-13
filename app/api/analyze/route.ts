// app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  // Get the list of image URLs from the request body
  const { imageUrls } = await request.json();

  if (!imageUrls || imageUrls.length === 0) {
    return NextResponse.json({ error: 'Image URLs are required' }, { status: 400 });
  }

  // This is the core prompt that tells the AI what to do
  const prompt = `
    You are a friendly and insightful analyst for a children's "interest discovery picture book" app.
    Look at the following collection of images that a child has uploaded because they found them interesting.
    Based on all the images, find common themes, colors, shapes, or subjects.
    Write a short, positive, and encouraging summary (in Japanese, about 2-3 sentences) directly to the child, telling them what their interests seem to be.
    Start with a friendly greeting.
  `;

  // Format the image URLs for the API call
  const messages: any = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        ...imageUrls.map((url: string) => ({ type: 'image_url', image_url: { url } })),
      ],
    },
  ];

  try {
    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // The latest multimodal model
      messages: messages,
      max_tokens: 200,
    });

    const analysis = response.choices[0].message.content;

    // Return the AI's response
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze images' }, { status: 500 });
  }
}