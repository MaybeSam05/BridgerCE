// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);
  
  if (request.action === "extractText") {
    try {
      console.log("Attempting to extract text from page...");
      console.log("Current URL:", window.location.href);
      console.log("Document ready state:", document.readyState);
      console.log("Document body exists:", !!document.body);
      
      if (!document.body) {
        console.error("Document body is not available");
        sendResponse({ 
          error: "Document body is not available", 
          url: window.location.href,
          readyState: document.readyState 
        });
        return true;
      }

      // === TreeWalker: Extract visible text ===
      function extractVisibleText() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (!node.parentNode) return NodeFilter.FILTER_REJECT;
            const style = window.getComputedStyle(node.parentNode);
            if (
              style &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0"
            ) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        });

        let text = '';
        while (walker.nextNode()) {
          const value = walker.currentNode.nodeValue.trim();
          if (value.length > 0) {
            text += value + ' ';
          }
        }

        return text.trim();
      }

      const bodyText = extractVisibleText();

      if (!bodyText || bodyText.trim().length === 0) {
        sendResponse({ 
          error: "No visible text found on page",
          url: window.location.href,
          textLength: 0
        });
        return true;
      }

      // Clean up the text: remove excessive whitespace
      const cleanedText = bodyText.slice(250, bodyText.length - 200);

      // Get the first 200 characters of cleaned text
      const first200Chars = cleanedText.substring(0, 200);

      sendResponse({ 
        text: first200Chars,
        cleanedText: cleanedText,
        url: window.location.href,
        originalLength: bodyText.length,
        cleanedLength: cleanedText.length,
        truncated: cleanedText.length > 200
      });

    } catch (error) {
      console.error("Error extracting text:", error);
      console.error("Error stack:", error.stack);
      sendResponse({ 
        error: error.message,
        stack: error.stack,
        url: window.location.href 
      });
    }
  } else {
    console.warn("Unknown action received:", request.action);
    sendResponse({ error: "Unknown action: " + request.action });
  }

  return true; // Async response
});

// Log when content script loads
console.log("Bridger content script loaded on:", window.location.href);
console.log("Content script timestamp:", new Date().toISOString());
