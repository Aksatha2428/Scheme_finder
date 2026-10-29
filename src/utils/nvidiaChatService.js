import { SCHEMES_DATA } from '../data/schemes.js';
import { evaluateEligibility } from './eligibilityEngine.js';
import { parseNaturalLanguageInput } from './nlpParser.js';

export const DEFAULT_NVIDIA_MODEL = "meta/llama-3.2-11b-vision-instruct";

/**
 * Builds system prompt with verified schemes knowledge and citizen profile state
 */
export function buildSystemPrompt(currentProfile = {}, language = 'en') {
  const schemesSummary = SCHEMES_DATA.map(s =>
    `- ${s.name} (${s.authority}, ${s.state}): For ${s.eligibility.occupation.join('/')}, Age ${s.eligibility.minAge}-${s.eligibility.maxAge}, Max Income ₹${s.eligibility.maxIncome.toLocaleString('en-IN')}, Category: ${s.eligibility.category.join('/')}. Benefit: ${s.benefits}`
  ).join('\n');

  return `You are Scheme Finder AI, a helpful general-purpose AI assistant with strong expertise in Indian government welfare schemes.
Answer the user's actual question, including questions unrelated to government schemes. Do not force every conversation into scheme eligibility or profile intake. When a question is about Indian welfare schemes, use the verified knowledge base below and explain how the citizen can check current official details.

LANGUAGE & TONE:
- Support English, Tamil, Tanglish, and other languages when possible. Respond in the language the user uses unless they ask for another language.
- Maintain a warm and respectful tone; keep answers clear and relevant.
- Use bullets or steps when they make an answer easier to follow.
- Be honest about uncertainty and limitations. Do not invent facts, current events, citations, scheme rules, or personal details. For time-sensitive or high-impact topics, say when information may need verification and recommend a reliable official or qualified source.

CAPABILITIES:
1. Answer general knowledge, explanations, writing, translation, brainstorming, and follow-up questions.
2. Help citizens understand government schemes, eligibility, benefits, documents, and application steps.
3. Ask for profile details only when they are relevant to the user's request, and ask one or two clarifying questions at a time.
4. Acknowledge and use corrections the user makes to their profile.

CURRENT KNOWN CITIZEN PROFILE:
${JSON.stringify(currentProfile, null, 2)}

VERIFIED SCHEME KNOWLEDGE BASE:
${schemesSummary}

PROFILE EXTRACTION PROTOCOL:
Whenever the citizen mentions or corrects profile details (name, age, gender, state, district, occupation, category, education, income, isDisabled, ownsLand, hasBplCard), append a hidden JSON block at the very end of your response inside <PROFILE_UPDATE> ... </PROFILE_UPDATE> tags with any updated fields.
Example:
<PROFILE_UPDATE>
{"age": 24, "occupation": "Farmer", "state": "Tamil Nadu"}
</PROFILE_UPDATE>
Only include keys that the user stated or updated.`;
}

/**
 * Client-side grounded fallback engine for offline or standalone operation
 */
function generateLocalGroundedResponse(messages, profile = {}, language = 'en') {
  const latestMsg = messages[messages.length - 1]?.text || '';
  const lower = latestMsg.toLowerCase();
  const isTamil = /[\u0B80-\u0BFF]/.test(latestMsg) || language === 'ta';

  // Extract updated profile
  const updatedProfile = parseNaturalLanguageInput(latestMsg, profile);

  // Match schemes
  let matches = [];
  if (lower.includes('kisan') || lower.includes('farmer') || lower.includes('விவசாயி') || lower.includes('விவசாயம்')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'pm-kisan'));
  }
  if (lower.includes('scholarship') || lower.includes('student') || lower.includes('college') || lower.includes('மாணவர்') || lower.includes('படிப்பு')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'post-matric-scholarship'));
    matches.push(SCHEMES_DATA.find(s => s.id === 'tn-pudhumai-penn'));
  }
  if (lower.includes('vendor') || lower.includes('stall') || lower.includes('street') || lower.includes('வியாபாரி') || lower.includes('svanidhi')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'pm-svanidhi'));
  }
  if (lower.includes('stand up') || lower.includes('woman entrepreneur') || lower.includes('stand-up')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'stand-up-india'));
  }
  if (lower.includes('mudra') || lower.includes('business loan') || lower.includes('loan') || lower.includes('கடன்')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'pm-mudra-yojana'));
  }
  if (lower.includes('awas') || lower.includes('housing') || lower.includes('வீடு')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'pm-awas-yojana-gramin'));
  }
  if (lower.includes('ayushman') || lower.includes('health') || lower.includes('மருத்துவம்')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'ayushman-bharat'));
  }
  if (lower.includes('vishwakarma') || lower.includes('artisan') || lower.includes('craftsman')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'pm-vishwakarma'));
  }
  if (lower.includes('pension') || lower.includes('atal') || lower.includes('ஓய்வூதியம்')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'atal-pension-yojana'));
  }
  if (lower.includes('sukanya') || lower.includes('girl child')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'sukanya-samriddhi'));
  }
  if (lower.includes('ladli') || lower.includes('behna')) {
    matches.push(SCHEMES_DATA.find(s => s.id === 'ladli-behna-yojana'));
  }

  matches = matches.filter(Boolean);

  if (matches.length > 0) {
    const top = matches[0];
    const evalResult = evaluateEligibility(updatedProfile, top);

    if (isTamil) {
      let reply = `வணக்கம்! நீங்கள் கேட்ட விவரங்களுக்கான அதிகாரப்பூர்வ அரசு நலத்திட்டம் இதோ:\n\n` +
        `### **${top.name}** (${top.authority})\n` +
        `• **பயன்:** ${top.benefits}\n` +
        `• **தகுதி:** வயது ${top.eligibility.minAge}-${top.eligibility.maxAge}, வருமான வரம்பு ₹${top.eligibility.maxIncome.toLocaleString('en-IN')}\n` +
        `• **தேவையான ஆவணங்கள்:** ${top.requiredDocuments.join(', ')}\n` +
        `• **அதிகாரப்பூர்வ தளம்:** [${top.officialUrl}](${top.officialUrl})\n\n` +
        `🔍 **உங்கள் தகுதி மதிப்பீடு:** **${evalResult.status}** (${evalResult.matchPercentage}% பொருத்தம்)\n` +
        `${evalResult.decisionExplanation}`;
      return { reply, extractedProfile: updatedProfile, provider: 'scheme-finder-local-engine' };
    }

    let reply = `Based on verified official government records for **${top.name}** (${top.authority}, ${top.state}):\n\n` +
      `• **Objective & Benefit:** ${top.objective}\n` +
      `  *Financial Grant / Assistance:* **${top.benefits}**\n\n` +
      `• **Eligibility Criteria:**\n` +
      `  - Age: ${top.eligibility.minAge} to ${top.eligibility.maxAge} years\n` +
      `  - Income Limit: Up to ₹${top.eligibility.maxIncome.toLocaleString('en-IN')} annually\n` +
      `  - Target Groups: ${(top.eligibility.occupation || []).join(', ')} (${(top.eligibility.category || []).join('/')})\n\n` +
      `• **Required Documents:**\n` +
      top.requiredDocuments.map(d => `  - ${d}`).join('\n') + `\n\n` +
      `• **Official Portal:** [${top.officialUrl}](${top.officialUrl})\n\n` +
      `---\n` +
      `🔍 **Personalized Eligibility Evaluation:**\n` +
      `Status: **${evalResult.status}** (${evalResult.matchPercentage}% criteria match)\n` +
      `${evalResult.decisionExplanation}`;

    if (matches.length > 1) {
      reply += `\n\n📌 **Other Recommended Schemes:**\n`;
      for (let i = 1; i < matches.length; i++) {
        reply += `• **${matches[i].name}**: ${matches[i].benefits} ([Official Portal](${matches[i].officialUrl}))\n`;
      }
    }

    return { reply, extractedProfile: updatedProfile, provider: 'scheme-finder-local-engine' };
  }

  const defaultReply = isTamil
    ? `வணக்கம்! நான் Scheme Finder AI வழிகாட்டி. மத்திய மற்றும் மாநில அரசு நலத்திட்டங்கள், உதவித்தொகைகள், கடன்கள் மற்றும் ஓய்வூதியங்கள் பற்றிய தகவல்களை வழங்க முடியும்.\n\nஉங்கள் வயது, தொழில் மற்றும் மாநிலத்தை குறிப்பிட்டால் உங்களுக்குரிய திட்டங்களை துல்லியமாக கண்டறியலாம்!`
    : `Namaste! I am Scheme Finder AI Assistant. I can help you discover every Central and State government welfare scheme, subsidy, scholarship, loan, and pension you qualify for.\n\nFeel free to ask about schemes for farmers, students, women entrepreneurs, street vendors, or housing, or share your profile details to evaluate your eligibility!`;

  return { reply: defaultReply, extractedProfile: updatedProfile, provider: 'scheme-finder-local-engine' };
}

/**
 * Calls NVIDIA NIM API through the same-origin development proxy.
 * If NVIDIA NIM is not configured or unavailable, automatically falls back
 * to the built-in intelligent Scheme Finder engine.
 * @param {Array} messages - Chat history [{sender, text}]
 * @param {Object} profile - Current citizen profile
 * @param {string} language - Target language ('en' | 'ta' | 'hi')
 * @returns {Promise<Object>} { reply, extractedProfile, provider }
 */
export async function sendNvidiaChatMessage(messages, profile = {}, language = 'en') {
  const systemPrompt = buildSystemPrompt(profile, language);
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-8).map(message => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text
    }))
  ];

  // Check for client-supplied API key in localStorage
  let userApiKey = null;
  try {
    if (typeof localStorage !== 'undefined') {
      userApiKey = localStorage.getItem('ys_nvidia_api_key');
    }
  } catch (e) {}

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  if (userApiKey && userApiKey.trim()) {
    headers["Authorization"] = `Bearer ${userApiKey.trim()}`;
  }

  // Tier 1: Try NVIDIA NIM API
  try {
    const response = await fetch("/api/nvidia/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: DEFAULT_NVIDIA_MODEL,
        messages: formattedMessages,
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 800
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content;
      if (typeof rawReply === 'string' && rawReply.trim()) {
        let cleanedReply = rawReply;
        let extractedProfile = {};
        const profileMatch = rawReply.match(/<PROFILE_UPDATE>([\s\S]*?)<\/PROFILE_UPDATE>/);
        if (profileMatch) {
          try {
            extractedProfile = JSON.parse(profileMatch[1].trim());
            cleanedReply = rawReply.replace(/<PROFILE_UPDATE>[\s\S]*?<\/PROFILE_UPDATE>/, '').trim();
          } catch (error) {
            console.warn("Could not parse profile update JSON:", error);
          }
        }
        return { reply: cleanedReply, extractedProfile, provider: 'nvidia-nim' };
      }
    }
  } catch (err) {
    // Silently proceed to intelligent fallback
    console.warn("NVIDIA NIM proxy not available, switching to Scheme Finder Grounded Engine:", err.message);
  }

  // Tier 2: Try Built-in Backend Server (/api/chat/message)
  try {
    const backendRes = await fetch("/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        messages,
        profile,
        language
      })
    });

    if (backendRes.ok) {
      const bData = await backendRes.json();
      if (bData && bData.reply) {
        return {
          reply: bData.reply,
          extractedProfile: bData.extractedProfile || {},
          provider: bData.provider || 'scheme-finder-grounded-engine'
        };
      }
    }
  } catch (err) {
    console.warn("Backend /api/chat/message offline, switching to client-side grounded engine:", err.message);
  }

  // Tier 3: Client-side intelligent grounded engine fallback
  return generateLocalGroundedResponse(messages, profile, language);
}

