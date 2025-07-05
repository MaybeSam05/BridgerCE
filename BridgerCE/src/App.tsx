import { authenticateUser, getStoredUserData, clearStoredUserData } from "./oauth";
import googleLogo from "./assets/googlelogo.png";
import textNoBG from "./assets/textNoBG.png";
import { useState, useEffect } from "react";
import { config } from "./config";

function App() {
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
              
              const context_prompt = "\n\nPlease compose a professional email requesting a 15-minute virtual coffee chat.";
              
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
                      content: `You are a professional email assistant. I will give you two LinkedIn profiles: mine and one from a person I want to connect with.

My LinkedIn Profile:
${userTXT}

Their LinkedIn Profile:
${clientTXT}${context_prompt}

Your task is to:
1. Analyze both profiles
2. Identify genuine points of connection (education, job roles, industries, locations, interests, etc.)
3. Compose a short, warm, professional email requesting a 15-minute virtual coffee chat
4. Be polite and authentic
5. Mention connections early to establish rapport
6. Keep it under 150 words
7. Only use information from the profiles and provided context

IMPORTANT FORMATTING INSTRUCTION:
You must return your response in **this format only**:  
subject line text here//email body text here

Do NOT add any labels such as “subject:” or “body:”.  
Do NOT add explanations, headers, or introductions.  
Do NOT include anything before or after the response.  
Do NOT wrap the response in quotes or code blocks.  
Failure to follow this format will result in the email being rejected.

Example:  
Connecting Around HealthTech & Stanford//Hi Jamie, I saw we both worked in healthtech and studied at Stanford...

Now write the email based on the profiles above.`
                    }
                  ],
                  max_tokens: config.CHATGPT_MAX_TOKENS,
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

  return (
    <div style={{ minHeight: "300px", minWidth: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none", padding: 0 }}>
      {!userData ? (
        <>
          {/* Logo at the top */}
          <div style={{ marginBottom: "24px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img 
              src={textNoBG} 
              alt="Bridger Logo" 
              style={{ width: "120px", height: "auto", marginBottom: "8px" }} 
            />
            <p style={{ fontSize: "14px", color: "#666", margin: 0, fontStyle: "italic" }}>
              LinkedIn Automation Tool
            </p>
          </div>
          {/* Sign in button (user's custom style) */}
          <button
            onClick={handleAuthClick}
            style={{
              padding: 10,
              backgroundColor: "#f2f2f2",
              color: "black",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "40px",
              fontSize: "12px",
              border: "none",
              margin: 0
            }}
          >
            <img style={{ width: 20, height: 20 }} src={googleLogo} alt="google" />
            Sign in with Google
          </button>
        </>
      ) : isComposingEmail ? (
        // Email Composition Interface
        <div style={{ 
          textAlign: "center", 
          width: "100%", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          padding: "16px",
          background: "white",
          minHeight: "400px"
        }}>
          {/* Logo */}
          <img 
            src={textNoBG} 
            alt="Bridger Logo" 
            style={{ width: "60px", height: "auto", marginBottom: "12px" }} 
          />
          
          <h3 style={{ 
            margin: "0 0 16px 0", 
            color: "#333",
            fontSize: "16px",
            fontWeight: "600"
          }}>
            Compose Email
          </h3>

          {/* Email Form */}
          <div style={{ 
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            gap: "12px"
          }}>
            {/* Email Address */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "12px", 
                color: "#666", 
                marginBottom: "4px",
                textAlign: "left"
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter recipient's email"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  color: "#333"
                }}
              />
            </div>

            {/* Subject */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "12px", 
                color: "#666", 
                marginBottom: "4px",
                textAlign: "left"
              }}>
                Subject
              </label>
              <input
                type="text"
                value={emailData?.subject || ""}
                onChange={(e) => setEmailData(prev => prev ? {...prev, subject: e.target.value} : null)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                  color: "#333"
                }}
              />
            </div>

            {/* Body */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "12px", 
                color: "#666", 
                marginBottom: "4px",
                textAlign: "left"
              }}>
                Message
              </label>
              <textarea
                value={emailData?.body || ""}
                onChange={(e) => setEmailData(prev => prev ? {...prev, body: e.target.value} : null)}
                rows={6}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: "white",
                  color: "#333"
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: "flex", 
              gap: "8px",
              marginTop: "8px"
            }}>
              <button
                onClick={handleSendEmail}
                disabled={sendEmailStatus === "loading"}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  background: sendEmailStatus === "success" ? "#4caf50" : "#1a70a1",
                  color: "white",
                  fontWeight: "500",
                  borderRadius: "4px",
                  fontSize: "12px",
                  border: "none",
                  cursor: sendEmailStatus === "loading" ? "not-allowed" : "pointer",
                  opacity: sendEmailStatus === "loading" ? 0.7 : 1
                }}
              >
                {sendEmailStatus === "loading" ? "Sending..." : 
                 sendEmailStatus === "success" ? "Sent!" : "Send Email"}
              </button>
              
              <button
                onClick={handleBackToMain}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                Back
              </button>
            </div>

            {/* Status Messages */}
            {sendEmailMsg && (
              <div style={{ 
                color: sendEmailStatus === "error" ? "#dc3545" : "#4caf50", 
                fontSize: "10px", 
                padding: "4px 8px",
                background: sendEmailStatus === "error" ? "rgba(220, 53, 69, 0.1)" : "rgba(76, 175, 80, 0.1)",
                borderRadius: "4px",
                maxWidth: "200px",
                wordWrap: "break-word"
              }}>
                {sendEmailMsg}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Main Interface
        <div style={{ 
          textAlign: "center", 
          width: "100%", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          padding: "16px",
          background: "white",
          minHeight: "200px"
        }}>
          {/* Logo */}
          <img 
            src={textNoBG} 
            alt="Bridger Logo" 
            style={{ width: "80px", height: "auto", marginBottom: "16px" }} 
          />
          
          {/* User Info */}
          <div style={{
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <h3 style={{ 
              margin: "0 0 4px 0", 
              color: "#333",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              {userData.name}
            </h3>
            
            <p style={{ 
              margin: "0", 
              color: "#666",
              fontSize: "11px"
            }}>
              {userData.email}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            gap: "8px"
          }}>
            <button
              onClick={hasUserTXT ? handleResetUserData : handleSetUserInfo}
              style={{
                padding: "8px 16px",
                background: setUserInfoStatus === "success" ? "#4caf50" : hasUserTXT ? "#dc3545" : "#1a70a1",
                color: "white",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "6px",
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                minWidth: "120px",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (setUserInfoStatus !== "success") {
                  e.currentTarget.style.background = hasUserTXT ? "#c82333" : "#155a7a";
                }
              }}
              onMouseLeave={(e) => {
                if (setUserInfoStatus !== "success") {
                  e.currentTarget.style.background = hasUserTXT ? "#dc3545" : "#1a70a1";
                }
              }}
              disabled={setUserInfoStatus === "success"}
            >
              {setUserInfoStatus === "success" ? (
                <>
                  <span style={{ fontSize: "12px" }}>✓</span>
                  Saved
                </>
              ) : hasUserTXT ? (
                "Reset user data"
              ) : (
                "Set Info"
              )}
            </button>
            
            {/* Get Connection Data Button - only show when user has data */}
            {hasUserTXT && (
              <button
                onClick={handleGetConnectionData}
                disabled={connectionDataStatus === "loading"}
                style={{
                  padding: "8px 16px",
                  background: connectionDataStatus === "success" ? "#4caf50" : "#28a745",
                  color: "white",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  border: "none",
                  cursor: connectionDataStatus === "loading" ? "not-allowed" : "pointer",
                  minWidth: "120px",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  opacity: connectionDataStatus === "loading" ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (connectionDataStatus !== "success" && connectionDataStatus !== "loading") {
                    e.currentTarget.style.background = "#218838";
                  }
                }}
                onMouseLeave={(e) => {
                  if (connectionDataStatus !== "success") {
                    e.currentTarget.style.background = "#28a745";
                  }
                }}
              >
                {connectionDataStatus === "loading" ? (
                  <>
                    <span style={{ fontSize: "12px" }}>⏳</span>
                    Processing...
                  </>
                ) : connectionDataStatus === "success" ? (
                  <>
                    <span style={{ fontSize: "12px" }}>✓</span>
                    Generated!
                  </>
                ) : (
                  "Get Connection Data"
                )}
              </button>
            )}
            
            {/* Status Messages */}
            {(setUserInfoMsg || connectionDataMsg) && (
              <div style={{ 
                color: (setUserInfoStatus === "error" || connectionDataStatus === "error") ? "#dc3545" : 
                       (setUserInfoStatus === "notLinkedIn" || connectionDataStatus === "notLinkedIn") ? "#ff9800" : "#4caf50", 
                fontSize: "10px", 
                padding: "4px 8px",
                background: (setUserInfoStatus === "error" || connectionDataStatus === "error") ? "rgba(220, 53, 69, 0.1)" : 
                           (setUserInfoStatus === "notLinkedIn" || connectionDataStatus === "notLinkedIn") ? "rgba(255, 152, 0, 0.1)" : "rgba(76, 175, 80, 0.1)",
                borderRadius: "4px",
                maxWidth: "200px",
                wordWrap: "break-word"
              }}>
                {setUserInfoMsg || connectionDataMsg}
              </div>
            )}
            
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                background: "transparent",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: "400",
                transition: "all 0.2s ease",
                marginTop: "4px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.borderColor = "#ccc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "#ddd";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
