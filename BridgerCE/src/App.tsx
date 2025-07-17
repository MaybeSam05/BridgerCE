import { authenticateUser, getStoredUserData, clearStoredUserData } from "./oauth";
import googleLogo from "./assets/googlelogo.png";
import textNoBG from "./assets/textNoBG.png";
import { useState, useEffect } from "react";
import { config } from "./config";

function App() {
  // ... keep existing code (all state declarations and useEffect)
  const [userData, setUserData] = useState<{
    email: string;
    name: string;
    token: string;
    userTXT?: string;
    lastUpdated: string;
  } | null>(null);
  const [setUserInfoStatus, setSetUserInfoStatus] = useState<null | "success" | "error" | "notLinkedIn">(null);
  const [setUserInfoMsg, setSetUserInfoMsg] = useState<string>("");
  const [hasUserTXT, setHasUserTXT] = useState<boolean>(false);
  
  // New state for connection data feature
  const [connectionDataStatus, setConnectionDataStatus] = useState<null | "loading" | "success" | "error" | "notLinkedIn">(null);
  const [connectionDataMsg, setConnectionDataMsg] = useState<string>("");
  const [emailData, setEmailData] = useState<{subject: string, body: string} | null>(null);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [isComposingEmail, setIsComposingEmail] = useState<boolean>(false);
  const [sendEmailStatus, setSendEmailStatus] = useState<null | "loading" | "success" | "error">(null);
  const [sendEmailMsg, setSendEmailMsg] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<null | "success" | "error">(null);

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [outputLength, setOutputLength] = useState<number>(150);
  const [tone, setTone] = useState<'neutral' | 'friendly' | 'professional'>('neutral');

  // Prompts for each tone
  const tonePrompts: Record<string, string> = {
    neutral: `You are a professional email assistant. I will provide two LinkedIn profiles: one is mine, and one belongs to someone I’d like to connect with.\n\nMy LinkedIn Profile:\n${userData?.userTXT || ''}\n\nTheir LinkedIn Profile:\n{clientTXT}\n\nPlease compose a professional email requesting a 15-minute virtual coffee chat.\n\nYour Task:\n\nCarefully analyze both profiles.\nIdentify specific, genuine points of connection (e.g. shared schools, roles, industries, skills, locations, or interests).\nUse those connections to craft a warm, authentic, and respectful email requesting a 15-minute virtual coffee chat.\nMention the relevant connection or shared interest early in the message to build rapport.\nKeep the tone professional but friendly and thoughtful — avoid anything generic or overly formal.\nEnsure the email is under ${outputLength} words.\nDo not use any information beyond what is included in the profiles and context prompt.\n\nIMPORTANT OUTPUT FORMAT:\nYou must return your response in this exact format:\nsubject line here//email body here\n\nDo NOT add explanations, headers, or introductions.\nDO NOT include any em dashes or other special characters.\nDO NOT include anything before or after the response.\nDO NOT wrap the response in quotes or code blocks.\nDO NOT include any labels like "Subject:" or "Body:"\n\nExample: Connecting Around HealthTech & Stanford//Hi Jamie, I saw we both worked in healthtech and studied at Stanford... \n\nNow generate the email based on the profiles provided.`,
    friendly: `You are a professional email assistant. I will provide two LinkedIn profiles: one is mine, and one belongs to someone I’d like to connect with.\n\nMy LinkedIn Profile:\n${userData?.userTXT || ''}\n\nTheir LinkedIn Profile:\n{clientTXT}\n\nYou're helping draft a warm, friendly, and approachable email for a 15-minute coffee chat. The tone should be upbeat, personable, and inviting, while still being respectful and professional. Use first names, express genuine interest, and make the recipient feel at ease. Keep it light and positive, and mention any shared interests or experiences early in the message. Avoid overly formal language, and aim for a conversational style.\n\nYour Task:\n\nCarefully analyze both profiles.\nIdentify specific, genuine points of connection (e.g. shared schools, roles, industries, skills, locations, or interests).\nUse those connections to craft a warm, authentic, and respectful email requesting a 15-minute virtual coffee chat.\nMention the relevant connection or shared interest early in the message to build rapport.\nKeep the tone friendly, upbeat, and thoughtful — avoid anything generic or overly formal.\nEnsure the email is under ${outputLength} words.\nDo not use any information beyond what is included in the profiles and context prompt.\n\nIMPORTANT OUTPUT FORMAT:\nYou must return your response in this exact format:\nsubject line here//email body here\n\nDo NOT add explanations, headers, or introductions.\nDO NOT include any em dashes or other special characters.\nDO NOT include anything before or after the response.\nDO NOT wrap the response in quotes or code blocks.\nDO NOT include any labels like "Subject:" or "Body:"\n\nExample: Coffee Chat About Product Design//Hi Taylor, I noticed we both have a passion for product design and went to similar schools... \n\nNow generate the email based on the profiles provided.`,
    professional: `You are a professional email assistant. I will provide two LinkedIn profiles: one is mine, and one belongs to someone I’d like to connect with.\n\nMy LinkedIn Profile:\n${userData?.userTXT || ''}\n\nTheir LinkedIn Profile:\n{clientTXT}\n\nYou're helping draft a highly professional and respectful email for a 15-minute coffee chat. The tone should be formal, courteous, and focused on career development. Use full names, reference the recipient’s professional achievements, and maintain a clear, concise structure. Avoid casual language, and emphasize the value of learning from the recipient’s experience. The message should be polished and businesslike, while still expressing genuine interest in connecting.\n\nYour Task:\n\nCarefully analyze both profiles.\nIdentify specific, genuine points of connection (e.g. shared schools, roles, industries, skills, locations, or interests).\nUse those connections to craft a respectful, formal, and concise email requesting a 15-minute virtual coffee chat.\nMention the relevant connection or shared interest early in the message to build rapport.\nKeep the tone professional, polished, and thoughtful — avoid anything generic or overly casual.\nEnsure the email is under ${outputLength} words.\nDo not use any information beyond what is included in the profiles and context prompt.\n\nIMPORTANT OUTPUT FORMAT:\nYou must return your response in this exact format:\nsubject line here//email body here\n\nDo NOT add explanations, headers, or introductions.\nDO NOT include any em dashes or other special characters.\nDO NOT include anything before or after the response.\nDO NOT wrap the response in quotes or code blocks.\nDO NOT include any labels like "Subject:" or "Body:"\n\nExample: Professional Networking Opportunity//Dear Dr. Smith, I am reaching out after seeing your impressive work in... \n\nNow generate the email based on the profiles provided.`
  };

  // Load stored user data when component mounts
  useEffect(() => {
    getStoredUserData()
      .then((data) => {
        if (data) {
          setUserData(data);
          setHasUserTXT(!!data.userTXT);
          console.log("Loaded stored user data:", data);
        }
      })
      .catch((error) => {
        console.error("Error loading stored data:", error);
      });
  }, []);

  // ... keep existing code (all handler functions - handleAuthClick, handleLogout, handleResetUserData, handleSetUserInfo, handleGetConnectionData, handleSendEmail, formatEmailBody, handleBackToMain)
  const handleAuthClick = () => {
    console.log("Button clicked!");
    console.log("Chrome object available:", typeof chrome !== 'undefined');
    console.log("Chrome identity available:", typeof chrome !== 'undefined' && !!chrome.identity);
    
    try {
      authenticateUser();
      // Refresh user data after authentication
      setTimeout(() => {
        getStoredUserData()
          .then((data) => {
            if (data) {
              setUserData(data);
            }
          })
          .catch((error) => {
            console.error("Error loading stored data:", error);
          });
      }, 1000); // Wait a bit for storage to be updated
    } catch (error) {
      console.error("Error in authentication:", error);
      alert("An error occurred during authentication. Please check the console for details.");
    }
  };

  const handleLogout = () => {
    clearStoredUserData()
      .then(() => {
        setUserData(null);
        console.log("User logged out");
      })
      .catch((error) => {
        console.error("Error clearing data:", error);
      });
  };

  const handleResetUserData = () => {
    chrome.storage.local.get(["userData"], (result) => {
      const userData = result.userData || {};
      delete userData.userTXT;
      chrome.storage.local.set({ userData }, () => {
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
        } else {
          console.log("User data reset successfully");
          setHasUserTXT(false);
          setUserData((prev) => prev ? ({ ...prev, userTXT: undefined }) : null);
          setSetUserInfoStatus(null);
          setSetUserInfoMsg("");
        }
      });
    });
  };

  // Handler for Set User Info
  const handleSetUserInfo = async () => {
    setSetUserInfoStatus(null);
    setSetUserInfoMsg("");
    // Get the current active tab
    if (!chrome.tabs) {
      setSetUserInfoStatus("error");
      setSetUserInfoMsg("chrome.tabs API not available");
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) {
        setSetUserInfoStatus("error");
        setSetUserInfoMsg("Could not get active tab");
        return;
      }
      if (!tab.url.startsWith("https://www.linkedin.com/in/")) {
        setSetUserInfoStatus("notLinkedIn");
        setSetUserInfoMsg("Page is not a LinkedIn profile");
        return;
      }
      console.log("Sending message to content script on tab:", tab.id, "URL:", tab.url);
      
      // First, try to inject the content script if it's not already there
      const injectContentScript = () => {
        return new Promise<void>((resolve) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ['contentScript.js']
          }, (result) => {
            if (chrome.runtime.lastError) {
              console.log("Content script injection result:", result);
              console.log("Injection error (this might be normal if already injected):", chrome.runtime.lastError);
              // Don't reject here, as the script might already be injected
              resolve();
            } else {
              console.log("Content script injected successfully");
              resolve();
            }
          });
        });
      };
      
      // Inject content script first, then send message
      injectContentScript().then(() => {
        // Wait a moment for the script to initialize
        setTimeout(() => {
          // Send message to content script to extract text
          chrome.tabs.sendMessage(tab.id!, { action: "extractText" }, (response) => {
            console.log("Received response from content script:", response);
            console.log("Chrome runtime last error:", chrome.runtime.lastError);
            
            if (chrome.runtime.lastError) {
              console.error("Chrome runtime error:", chrome.runtime.lastError);
              setSetUserInfoStatus("error");
              setSetUserInfoMsg(`Chrome error: ${chrome.runtime.lastError.message}`);
              return;
            }
            
            if (!response) {
              console.error("No response received from content script");
              setSetUserInfoStatus("error");
              setSetUserInfoMsg("No response from content script");
              return;
            }
            
            if (response.error) {
              console.error("Content script error:", response.error);
              setSetUserInfoStatus("error");
              setSetUserInfoMsg(`Content script error: ${response.error}`);
              return;
            }
            
            if (!response.text) {
              console.error("No text in response:", response);
              setSetUserInfoStatus("error");
              setSetUserInfoMsg("No text content in response");
              return;
            }
            
            const extractedText = response.text;
            console.log("Successfully extracted LinkedIn text, length (snippet):", extractedText.length);
            if (response.cleanedLength !== undefined) {
              console.log("Full cleaned text length:", response.cleanedLength);
            }
            if (response.originalLength !== undefined) {
              console.log("Original extracted text length:", response.originalLength);
            }
            console.log("First 200 characters:", extractedText.substring(0, 200));
            
            // Save to userTXT in userData
            chrome.storage.local.get(["userData"], (result) => {
              const userData = result.userData || {};
              userData.userTXT = extractedText;
              chrome.storage.local.set({ userData }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Storage error:", chrome.runtime.lastError);
                  setSetUserInfoStatus("error");
                  setSetUserInfoMsg("Failed to save user data");
                } else {
                  console.log("Successfully saved user data to storage");
                  setSetUserInfoStatus("success");
                  setSetUserInfoMsg("User data saved!");
                  setHasUserTXT(true);
                  // Update local state
                  setUserData((prev) => prev ? ({ ...prev, userTXT: extractedText }) : null);
                  
                  // Clear success message after 2 seconds
                  setTimeout(() => {
                    setSetUserInfoStatus(null);
                    setSetUserInfoMsg("");
                  }, 2000);
                }
              });
            });
          });
        }, 500); // Wait 500ms for script to initialize
      });
    });
  };

  // Handler for Get Connection Data
  const handleGetConnectionData = async () => {
    setConnectionDataStatus("loading");
    setConnectionDataMsg("Extracting connection data...");
    
    // Get the current active tab
    if (!chrome.tabs) {
      setConnectionDataStatus("error");
      setConnectionDataMsg("chrome.tabs API not available");
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) {
        setConnectionDataStatus("error");
        setConnectionDataMsg("Could not get active tab");
        return;
      }
      if (!tab.url.startsWith("https://www.linkedin.com/in/")) {
        setConnectionDataStatus("notLinkedIn");
        setConnectionDataMsg("Page is not a LinkedIn profile");
        return;
      }
      
      // Inject content script and extract text
      const injectContentScript = () => {
        return new Promise<void>((resolve) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ['contentScript.js']
          }, (result) => {
            if (chrome.runtime.lastError) {
              console.log("Content script injection result:", result);
              console.log("Injection error (this might be normal if already injected):", chrome.runtime.lastError);
              resolve();
            } else {
              console.log("Content script injected successfully");
              resolve();
            }
          });
        });
      };
      
      injectContentScript().then(() => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id!, { action: "extractText" }, async (response) => {
            if (chrome.runtime.lastError) {
              console.error("Chrome runtime error:", chrome.runtime.lastError);
              setConnectionDataStatus("error");
              setConnectionDataMsg(`Chrome error: ${chrome.runtime.lastError.message}`);
              return;
            }
            
            if (!response || response.error || !response.text) {
              setConnectionDataStatus("error");
              setConnectionDataMsg("Failed to extract connection data");
              return;
            }
            
            const clientTXT = response.text;
            const userTXT = userData?.userTXT;
            
            if (!userTXT) {
              setConnectionDataStatus("error");
              setConnectionDataMsg("No user data found. Please set your info first.");
              return;
            }
            
            // Call ChatGPT API
            try {
              setConnectionDataMsg("Generating email...");
              
              const context_prompt = tonePrompts[tone].replace('{clientTXT}', clientTXT);
              
              console.log("Sending request to ChatGPT API...");
              console.log("Request payload:", {
                model: config.CHATGPT_MODEL,
                max_tokens: config.CHATGPT_MAX_TOKENS,
                temperature: config.CHATGPT_TEMPERATURE,
                userTXT_length: userTXT.length,
                clientTXT_length: clientTXT.length
              });
              
              const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${config.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                  model: config.CHATGPT_MODEL,
                  messages: [
                    {
                      role: "system",
                      content: "You're helping draft an email for a 15-minute coffee chat."
                    },
                    {
                      role: "user",
                      content: context_prompt
                    }
                  ],
                  max_tokens: Math.round(outputLength * 2), // rough estimate: 2 tokens per word
                  temperature: config.CHATGPT_TEMPERATURE
                })
              });
              
              console.log("ChatGPT API response status:", response.status);
              console.log("ChatGPT API response headers:", Object.fromEntries(response.headers.entries()));
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error("ChatGPT API error response:", errorText);
                throw new Error(`ChatGPT API error: ${response.status} - ${errorText}`);
              }
              
              const data = await response.json();
              console.log("ChatGPT API response data:", data);
              console.log("ChatGPT API response data type:", typeof data);
              console.log("ChatGPT API response data keys:", Object.keys(data));
              
              const generatedText = data.choices?.[0]?.message?.content;
              console.log("Generated text:", generatedText);
              console.log("Generated text type:", typeof generatedText);
              console.log("Generated text length:", generatedText?.length);
              
              if (!generatedText) {
                console.error("No generated text found in response");
                console.error("Full response data:", JSON.stringify(data, null, 2));
                throw new Error("No response from ChatGPT");
              }
              
              // Parse the response (format: subject//body)
              console.log("Attempting to parse response with format: subject//body");
              const parts = generatedText.split('//');
              console.log("Split parts:", parts);
              console.log("Number of parts:", parts.length);
              
              if (parts.length !== 2) {
                console.error("Invalid response format. Expected 2 parts, got:", parts.length);
                console.error("Full generated text:", generatedText);
                throw new Error(`Invalid response format from ChatGPT. Expected 'subject//body', got: ${generatedText.substring(0, 100)}...`);
              }
              
              const subject = parts[0].trim();
              const rawBody = parts[1].trim();
              const formattedBody = formatEmailBody(rawBody);
              
              console.log("Parsed subject:", subject);
              console.log("Parsed body:", rawBody);
              console.log("Formatted body:", formattedBody);
              
              setEmailData({ subject, body: formattedBody });
              setConnectionDataStatus("success");
              setConnectionDataMsg("Email generated successfully!");
              setIsComposingEmail(true);
              
              // Clear success message after 2 seconds
              setTimeout(() => {
                setConnectionDataStatus(null);
                setConnectionDataMsg("");
              }, 2000);
              
            } catch (error: unknown) {
              console.error("ChatGPT API error:", error);
              console.error("Error type:", typeof error);
              console.error("Error constructor:", error?.constructor?.name);
              if (error instanceof Error) {
                console.error("Error stack:", error.stack);
              }
              setConnectionDataStatus("error");
              setConnectionDataMsg(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          });
        }, 500);
      });
    });
  };

  // Handler for sending email via Gmail
  const handleSendEmail = async () => {
    if (!emailAddress || !emailData) {
      setSendEmailStatus("error");
      setSendEmailMsg("Please fill in all fields");
      return;
    }
    
    setSendEmailStatus("loading");
    setSendEmailMsg("Sending email...");
    
    try {
      const token = userData?.token;
      if (!token) {
        throw new Error("No OAuth token found");
      }
      
      // Create the email message
      const message = {
        to: emailAddress,
        subject: emailData.subject,
        body: emailData.body
      };
      
      // Encode the message for Gmail API
      const emailContent = [
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        '',
        message.body
      ].join('\n');
      
      // Handle Unicode characters properly for base64 encoding
      const encodedMessage = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      const response = await fetch(config.GMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gmail API error: ${errorData.error?.message || response.statusText}`);
      }
      
      setSendEmailStatus("success");
      setSendEmailMsg("Email sent successfully!");
      
      // Reset form after success
      setTimeout(() => {
        setIsComposingEmail(false);
        setEmailData(null);
        setEmailAddress("");
        setSendEmailStatus(null);
        setSendEmailMsg("");
      }, 2000);
      
    } catch (error: unknown) {
      console.error("Send email error:", error);
      setSendEmailStatus("error");
      setSendEmailMsg(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to format email body with proper line breaks
  const formatEmailBody = (body: string): string => {
    let formattedBody = body;
    
    // Find the first comma and add newline after it
    const firstCommaIndex = formattedBody.indexOf(',');
    if (firstCommaIndex !== -1) {
      formattedBody = formattedBody.substring(0, firstCommaIndex + 1) + '\n\n' + formattedBody.substring(firstCommaIndex + 1);
    }
    
    // Find the last comma and add newline before and after it
    const lastCommaIndex = formattedBody.lastIndexOf(',');
    if (lastCommaIndex !== -1 && lastCommaIndex !== firstCommaIndex) {
      // Get the word after the last comma
      const afterComma = formattedBody.substring(lastCommaIndex + 1).trim();
      const beforeComma = formattedBody.substring(0, lastCommaIndex);
      
      // Reconstruct with newlines around the last comma
      formattedBody = beforeComma + '\n\n' + afterComma;
    }
    
    return formattedBody;
  };

  // Handler to go back to main view
  const handleBackToMain = () => {
    setIsComposingEmail(false);
    setEmailData(null);
    setEmailAddress("");
    setSendEmailStatus(null);
    setSendEmailMsg("");
  };

  // Handler for copying email body to clipboard
  const handleCopyToClipboard = async () => {
    if (!emailData?.body) {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus(null), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(emailData.body);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  return (
    <div className="min-h-[350px] min-w-[380px] h-full w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-lg transform -translate-x-12 translate-y-12"></div>
      
      {/* Settings Cog - Top Right */}
      {userData && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all border border-gray-200"
            title="Settings"
          >
            {/* Heroicons Cog6Tooth Outline */}
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      )}
      {/* Settings Panel - Centered in App */}
      {userData && settingsOpen && (
        <div className="absolute left-1/2 top-16 -translate-x-1/2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-40">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Output Length ({outputLength} words)</label>
            <input
              type="range"
              min={150}
              max={500}
              value={outputLength}
              onChange={e => setOutputLength(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
            <div className="flex gap-1">
              <button
                className={`flex-1 py-2 text-xs rounded-lg font-semibold border transition-all duration-200 ${tone === 'friendly' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setTone('friendly')}
              >
                Friendly
              </button>
              <button
                className={`flex-1 py-2 text-xs rounded-lg font-semibold border transition-all duration-200 ${tone === 'neutral' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setTone('neutral')}
              >
                Neutral
              </button>
              <button
                className={`flex-1 py-2 text-xs rounded-lg font-semibold border transition-all duration-200 ${tone === 'professional' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setTone('professional')}
              >
                Professional
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10 p-6">
        {!userData ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Logo Section */}
            <div className="space-y-3">
              <div className="w-36 h-20 mx-auto relative">
                <img 
                  src={textNoBG} 
                  alt="Bridger Logo" 
                  className="w-full h-full object-contain drop-shadow-sm" 
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">
                  LinkedIn Automation Tool
                </p>
                <p className="text-xs text-slate-500">
                  Connect smarter, not harder
                </p>
              </div>
            </div>
            
            {/* Sign In Button */}
            <button
              onClick={handleAuthClick}
              className="group relative bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-6 rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-105 flex items-center gap-3 min-w-[200px] justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img className="w-5 h-5 relative z-10" src={googleLogo} alt="Google" />
              <span className="relative z-10">Sign in with Google</span>
            </button>
          </div>
        ) : isComposingEmail ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-20 h-12 mx-auto">
                <img 
                  src={textNoBG} 
                  alt="Bridger Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Compose Email</h2>
              </div>
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              {/* Email Address Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 shadow-sm text-gray-900"
                />
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailData?.subject || ""}
                  onChange={(e) => setEmailData(prev => prev ? {...prev, subject: e.target.value} : null)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm shadow-sm text-gray-900"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Message
                </label>
                <div className="relative">
                  <textarea
                    value={emailData?.body || ""}
                    onChange={(e) => setEmailData(prev => prev ? {...prev, body: e.target.value} : null)}
                    rows={5}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm resize-none shadow-sm placeholder-gray-400 text-gray-900"
                    placeholder="Your personalized message will appear here..."
                  />
                  <button
                    onClick={handleCopyToClipboard}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all duration-200 ${
                      copyStatus === "success" 
                        ? "bg-green-500 text-white" 
                        : copyStatus === "error"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
                    }`}
                    title="Copy to clipboard"
                  >
                    {copyStatus === "success" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : copyStatus === "error" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendEmail}
                  disabled={sendEmailStatus === "loading"}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 ${
                    sendEmailStatus === "loading" 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : sendEmailStatus === "success"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  } text-white`}
                >
                  {sendEmailStatus === "loading" && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {sendEmailStatus === "success" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {sendEmailStatus === "loading" ? "Sending..." : 
                   sendEmailStatus === "success" ? "Sent!" : "Send Email"}
                </button>
                
                <button
                  onClick={handleBackToMain}
                  className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>

              {/* Status Message */}
              {sendEmailMsg && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  sendEmailStatus === "error" 
                    ? "bg-red-50 text-red-700 border border-red-200" 
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}>
                  {sendEmailStatus === "error" ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {sendEmailMsg}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-24 h-14 mx-auto">
                <img 
                  src={textNoBG} 
                  alt="Bridger Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              
              {/* User Profile Card */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      {userData.name}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">
                      {userData.email}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={hasUserTXT ? handleResetUserData : handleSetUserInfo}
                disabled={setUserInfoStatus === "success"}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 ${
                  setUserInfoStatus === "success" 
                    ? "bg-green-500 text-white cursor-default" 
                    : hasUserTXT 
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                }`}
              >
                {setUserInfoStatus === "success" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Profile Saved
                  </>
                ) : hasUserTXT ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Profile Data
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Set Profile Info
                  </>
                )}
              </button>
              
              {hasUserTXT && (
                <button
                  onClick={handleGetConnectionData}
                  disabled={connectionDataStatus === "loading"}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 ${
                    connectionDataStatus === "loading" 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : connectionDataStatus === "success"
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  } text-white`}
                >
                  {connectionDataStatus === "loading" && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {connectionDataStatus === "success" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!connectionDataStatus && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  
                  {connectionDataStatus === "loading" ? "Analyzing Profiles..." :
                   connectionDataStatus === "success" ? "Email Generated!" : "Generate Connection Email"}
                </button>
              )}
              
              {/* Status Messages */}
              {(setUserInfoMsg || connectionDataMsg) && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
                  (setUserInfoStatus === "error" || connectionDataStatus === "error") 
                    ? "bg-red-50 text-red-700 border border-red-200" 
                    : (setUserInfoStatus === "notLinkedIn" || connectionDataStatus === "notLinkedIn")
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                }`}>
                  {(setUserInfoStatus === "error" || connectionDataStatus === "error") ? (
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (setUserInfoStatus === "notLinkedIn" || connectionDataStatus === "notLinkedIn") ? (
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="break-words leading-relaxed">
                    {setUserInfoMsg || connectionDataMsg}
                  </span>
                </div>
              )}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-white/50 hover:bg-white/70 text-slate-600 border border-slate-200 rounded-xl transition-all duration-200 text-xs font-medium shadow-sm backdrop-blur-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
