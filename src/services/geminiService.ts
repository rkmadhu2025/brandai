import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSocialPost(topic: string, platform: string, tone: string = "professional", length: string = "medium", includeKeywords: string = "", excludeKeywords: string = "", cta: string = "", targetAudience: string = "") {
  try {
    let lengthInstruction = "Keep it concise and impactful.";
    if (length === "short") lengthInstruction = "Keep it very short and punchy (under 100 characters if possible).";
    if (length === "long") lengthInstruction = "Provide a detailed and comprehensive post with multiple paragraphs.";

    const keywordsInstruction = `
      ${includeKeywords ? `MUST include these keywords: ${includeKeywords}.` : ""}
      ${excludeKeywords ? `MUST NOT include these keywords: ${excludeKeywords}.` : ""}
    `;

    const extraInstructions = `
      ${cta ? `Include this specific Call to Action: ${cta}.` : ""}
      ${targetAudience ? `Target Audience: ${targetAudience}.` : ""}
    `;

    let promptText = `Generate a highly engaging ${platform} post about: "${topic}". 
          Tone: ${tone}. 
          ${lengthInstruction}
          ${keywordsInstruction}
          ${extraInstructions}
          Include relevant emojis and hashtags. 
          Optimize for the ${platform} audience.`;

    if (platform === 'youtube') {
      promptText = `Generate a highly engaging YouTube video title and description about: "${topic}". 
          Tone: ${tone}. 
          ${lengthInstruction}
          ${keywordsInstruction}
          ${extraInstructions}
          The title should be catchy and click-worthy (but not clickbait).
          The description should include a hook, a summary of the video content, relevant timestamps (if applicable), links to resources, and relevant hashtags.
          
          Format the output as:
          TITLE: [Your Title Here]
          DESCRIPTION: [Your Description Here]`;
    } else if (platform === 'youtube-shorts') {
      promptText = `Generate a highly engaging YouTube Shorts video title, description, and a 60-second script about: "${topic}". 
          Tone: ${tone}. 
          ${lengthInstruction}
          ${keywordsInstruction}
          ${extraInstructions}
          The title should be extremely catchy, short, and click-worthy.
          The description should be concise, include a strong hook, a brief summary, and relevant hashtags including #shorts.
          The script should be optimized for a fast-paced 60-second vertical video format, including visual cues and a clear hook-value-cta structure.
          
          Format the output as:
          TITLE: [Your Title Here]
          DESCRIPTION: [Your Description Here]
          SCRIPT: [Your Script Here]`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: promptText
        }]
      }]
    });
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating post. Please try again.";
  }
}

export async function optimizeProfile(bio: string, skills: string, experience: string = "", targetRole: string = "") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `You are an expert career coach and SEO specialist. 
          Analyze this user's profile and provide a structured optimization plan in JSON format.
          
          Target Role: ${targetRole}
          Current Bio: ${bio}
          Current Skills: ${skills}
          Current Experience: ${experience}
          
          The JSON should include:
          - "headlineSuggestions": An array of 3-5 punchy, SEO-optimized headlines for LinkedIn/Twitter, specifically targeting the role of ${targetRole}.
          - "optimizedSummary": A concise and impactful professional summary (max 3-4 sentences) that strongly highlights key achievements, quantifiable results, and skills directly relevant to the ${targetRole} role.
          - "keywordRecommendations": A list of 5-10 high-impact SEO keywords for the ${targetRole} role and their industry.
          - "skillSuggestions": 3-5 new skills they should acquire based on current market demand for ${targetRole} positions.
          - "brandingAdvice": 2-3 specific tips to improve their online presence and visibility for ${targetRole} recruiters.
          - "seoAnalysis": A brief (1-2 sentence) analysis of how their current profile performs for search engines.
          
          Return ONLY the JSON.`
        }]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function rewriteContent(text: string, platform: string, tone: string, length: string = "medium", includeKeywords: string = "", excludeKeywords: string = "", cta: string = "", targetAudience: string = "") {
  try {
    let lengthInstruction = "Maintain a similar length to the original or optimize for the platform.";
    if (length === "short") lengthInstruction = "Rewrite it to be much shorter and more concise.";
    if (length === "long") lengthInstruction = "Expand on the content to make it more detailed and long-form.";

    const keywordsInstruction = `
      ${includeKeywords ? `MUST include these keywords: ${includeKeywords}.` : ""}
      ${excludeKeywords ? `MUST NOT include these keywords: ${excludeKeywords}.` : ""}
    `;

    const extraInstructions = `
      ${cta ? `Include this specific Call to Action: ${cta}.` : ""}
      ${targetAudience ? `Target Audience: ${targetAudience}.` : ""}
    `;

    let promptText = `Rewrite the following content for ${platform} with a ${tone} tone. 
          Content: "${text}"
          
          Requirements:
          - ${lengthInstruction}
          - ${keywordsInstruction}
          - ${extraInstructions}
          - Optimize for ${platform}'s specific audience and character limits.
          - Maintain the core message but adapt the delivery.
          - Include relevant emojis and hashtags if appropriate for the platform.
          - If it's for Twitter, ensure it's under 280 characters or formatted as a short thread.
          
          Return the rewritten text.`;

    if (platform === 'youtube') {
      promptText = `Rewrite the following content into a highly engaging YouTube video title and description with a ${tone} tone. 
          Content: "${text}"
          
          Requirements:
          - ${lengthInstruction}
          - ${keywordsInstruction}
          - ${extraInstructions}
          - The title should be catchy and click-worthy.
          - The description should include a hook, a summary of the core message, and relevant hashtags.
          - Maintain the core message but adapt the delivery for a video audience.
          
          Format the output as:
          TITLE: [Your Title Here]
          DESCRIPTION: [Your Description Here]`;
    } else if (platform === 'youtube-shorts') {
      promptText = `Rewrite the following content into a highly engaging YouTube Shorts video title, description, and a 60-second script with a ${tone} tone. 
          Content: "${text}"
          
          Requirements:
          - ${lengthInstruction}
          - ${keywordsInstruction}
          - ${extraInstructions}
          - The title should be extremely catchy, short, and click-worthy.
          - The description should be concise, include a strong hook, a brief summary, and relevant hashtags including #shorts.
          - The script should be optimized for a fast-paced 60-second vertical video format, including visual cues and a clear hook-value-cta structure.
          - Maintain the core message but adapt the delivery for a short-form video audience.
          
          Format the output as:
          TITLE: [Your Title Here]
          DESCRIPTION: [Your Description Here]
          SCRIPT: [Your Script Here]`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: promptText
        }]
      }]
    });
    return response.text || "Failed to rewrite content.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error rewriting content.";
  }
}

export async function generateArticle(topic: string, tone: string = "professional", length: string = "medium", includeKeywords: string = "", excludeKeywords: string = "", cta: string = "", targetAudience: string = "") {
  try {
    let lengthInstruction = "Write a standard long-form article (around 800-1000 words).";
    if (length === "short") lengthInstruction = "Write a short, concise article or blog post (around 300-400 words).";
    if (length === "long") lengthInstruction = "Write an in-depth, comprehensive long-form article (1500+ words).";

    const keywordsInstruction = `
      ${includeKeywords ? `MUST include these keywords: ${includeKeywords}.` : ""}
      ${excludeKeywords ? `MUST NOT include these keywords: ${excludeKeywords}.` : ""}
    `;

    const extraInstructions = `
      ${cta ? `Include this specific Call to Action: ${cta}.` : ""}
      ${targetAudience ? `Target Audience: ${targetAudience}.` : ""}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Write a high-quality article about: "${topic}". 
          Tone: ${tone}. 
          ${lengthInstruction}
          ${keywordsInstruction}
          ${extraInstructions}
          The article should include:
          - A catchy headline.
          - An engaging introduction.
          - 3-4 main sections with subheadings.
          - A strong conclusion.
          - A call to action.
          
          Format it in Markdown.`
        }]
      }]
    });
    return response.text || "Failed to generate article.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating article.";
  }
}

export async function generateProfileSummary(experience: string, skills: string, tone: string = "professional", length: string = "medium", includeKeywords: string = "", excludeKeywords: string = "", cta: string = "", targetAudience: string = "") {
  let lengthInstruction = "around 3-4 sentences";
  if (length === "short") lengthInstruction = "1-2 sentences (very concise)";
  if (length === "long") lengthInstruction = "2-3 paragraphs (detailed)";

  const keywordsInstruction = `
    ${includeKeywords ? `MUST include these keywords: ${includeKeywords}.` : ""}
    ${excludeKeywords ? `MUST NOT include these keywords: ${excludeKeywords}.` : ""}
  `;

  const extraInstructions = `
    ${cta ? `Include this specific Call to Action: ${cta}.` : ""}
    ${targetAudience ? `Target Audience: ${targetAudience}.` : ""}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Write a compelling professional profile summary based on:
          Experience: ${experience}
          Skills: ${skills}
          Tone: ${tone}
          
          Requirements:
          - Length: ${lengthInstruction}
          - ${keywordsInstruction}
          - ${extraInstructions}
          
          The summary should be punchy and highlight the unique value proposition. 
          It should be suitable for a LinkedIn "About" section or a portfolio.`
        }]
      }]
    });
    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating summary.";
  }
}

export async function suggestJobs(userProfile: any, recentContent: string = "", preferences: any = null) {
  try {
    const prefString = preferences ? `
    Preferences:
    - Location: ${preferences.location}
    - Job Type: ${preferences.jobType}
    - Experience Level: ${preferences.experienceLevel}
    - Minimum Match Score: ${preferences.minMatchScore || 70}
    ` : "";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Find 3 real, current job openings that would be a great fit for this user. 
          Use Google Search to find actual job listings if possible.
          
          User Profile:
          - Bio: ${userProfile.bio}
          - Skills: ${userProfile.skills}
          - Experience: ${userProfile.experience}
          - Target Role: ${userProfile.target_role}
          
          ${prefString}
          
          Recent Content & Search Context:
          ${recentContent}
          
          Consider the user's recent content performance and engagement metrics to improve the accuracy of the job match score. If the user posts about specific topics that get high engagement, prioritize jobs related to those topics.
          CRITICAL: If a Search Context is provided (Keywords, Location, Industry), you MUST prioritize finding jobs that match those specific criteria over the general profile preferences.
          Ensure that all suggested jobs have a match score of AT LEAST ${preferences?.minMatchScore || 70}.
          
          Return a JSON array of objects, each with:
          - "title": Job title
          - "company": Company name
          - "location": City or "Remote"
          - "description": A short 1-sentence description of the role
          - "url": The direct link to the job posting or company careers page
          - "match_score": A number between 70 and 100 representing how well it matches the profile.
          - "job_type": e.g., "Full-time", "Contract", "Freelance"
          - "experience_level": e.g., "Junior", "Mid", "Senior", "Lead"
          
          Return ONLY the JSON array.`
        }]
      }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
              match_score: { type: Type.NUMBER },
              job_type: { type: Type.STRING },
              experience_level: { type: Type.STRING }
            },
            required: ["title", "company", "location", "description", "url", "match_score", "job_type", "experience_level"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Job Suggestion Error:", error);
    return [];
  }
}

export async function suggestContentIdeas(userProfile: any, industry: string, targetRole: string = "") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `You are a social media strategist. Based on the user's profile and industry, suggest 5 creative and engaging post ideas.
          Include a mix of platforms: LinkedIn, Twitter, YouTube, and YouTube Shorts.
          For each idea, provide a catchy title, a brief description of the concept, and a full draft for the post.
          
          User Profile:
          - Bio: ${userProfile.bio}
          - Skills: ${userProfile.skills}
          - Target Role: ${targetRole || userProfile.target_role}
          - Industry: ${industry}
          
          Consider current industry trends and the user's expertise.
          
          Return a JSON array of objects, each with:
          - "id": A unique string ID
          - "title": A catchy title for the idea
          - "concept": A short description of why this post would work
          - "draft": A complete, ready-to-use post draft. For YouTube, include Title and Description.
          - "platform": One of "linkedin", "twitter", "youtube", "youtube-shorts"
          
          Return ONLY the JSON array.`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              concept: { type: Type.STRING },
              draft: { type: Type.STRING },
              platform: { type: Type.STRING }
            },
            required: ["id", "title", "concept", "draft", "platform"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Content Ideas Error:", error);
    return [];
  }
}

export async function generateImage(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a high-quality, professional social media illustration for: "${prompt}". 
            Style: Modern, clean, professional, suitable for LinkedIn or Twitter. 
            Avoid text in the image.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return null;
  }
}

export async function generateVideo(prompt: string, style: string = "professional", length: string = "medium", resolution: '720p' | '1080p' = '720p', aspectRatio: '16:9' | '9:16' = '16:9') {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
    const aiVideo = new GoogleGenAI({ apiKey });
    
    let styleDescription = "Professional, high-quality social media video";
    if (style === "cinematic") styleDescription = "Cinematic lighting, high dynamic range, epic feel, movie-like quality";
    if (style === "realistic") styleDescription = "Natural lighting, lifelike textures, realistic movements, documentary style";
    if (style === "professional") styleDescription = "Clean, corporate, high-end production value, polished look";
    if (style === "creative") styleDescription = "Artistic, vibrant colors, unique visual style, experimental and bold";
    if (style === "minimalist") styleDescription = "Simple, clean lines, uncluttered composition, focused and elegant";

    let lengthInstruction = "around 10-15 seconds";
    if (length === "short") lengthInstruction = "around 5-10 seconds";
    if (length === "long") lengthInstruction = "around 20-30 seconds";

    let operation = await aiVideo.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: `Create a ${styleDescription} for: "${prompt}". Target length: ${lengthInstruction}.`,
      config: {
        numberOfVideos: 1,
        resolution: resolution,
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await aiVideo.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Requested entity was not found.");
      }
      throw new Error("Failed to fetch video.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Gemini Video Error:", error);
    throw error;
  }
}

export async function analyzeJobDescription(jobTitle: string, company: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Analyze the following job description for the role of "${jobTitle}" at "${company}".
          
          Job Description:
          "${description}"
          
          Provide a structured analysis in JSON format including:
          - "summary": A brief 2-3 sentence summary of the role.
          - "keySkills": An array of the top 5-7 technical and soft skills required.
          - "requirements": An array of the primary requirements (experience, education, etc.).
          - "redFlags": An array of potential concerns or "red flags" (e.g., vague responsibilities, "rockstar" culture, lack of salary info, etc.). If none, return an empty array.
          - "advice": A short piece of advice for the applicant.
          
          Return ONLY the JSON.`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING }
          },
          required: ["summary", "keySkills", "requirements", "redFlags", "advice"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Job Analysis Error:", error);
    return null;
  }
}
